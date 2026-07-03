CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
    CREATE TYPE chunk_type AS ENUM ('SYSTEM', 'STATE', 'LIVING', 'SCRATCH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS tq_chunks (
    id UUID PRIMARY KEY,
    namespace TEXT NOT NULL,
    type chunk_type NOT NULL,
    title TEXT,
    body TEXT,
    tags TEXT[],
    importance REAL CHECK (importance >= 0.0 AND importance <= 1.0),
    ttl_days INT,
    provenance JSONB,
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    body_tsv TSVECTOR
);

CREATE TABLE IF NOT EXISTS tq_vectors (
    chunk_id UUID PRIMARY KEY REFERENCES tq_chunks(id) ON DELETE CASCADE,
    embedding vector(1536)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tq_chunks_tags ON tq_chunks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_tq_chunks_body_tsv ON tq_chunks USING GIN (body_tsv);
CREATE INDEX IF NOT EXISTS idx_tq_vectors_embedding ON tq_vectors USING IVFFLAT (embedding vector_cosine_ops);

-- Triggers for body_tsv
CREATE OR REPLACE FUNCTION tq_chunks_tsvector_trigger() RETURNS trigger AS $$
begin
  new.body_tsv :=
    setweight(to_tsvector('pg_catalog.english', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('pg_catalog.english', coalesce(new.body,'')), 'B');
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON tq_chunks;
    ON tq_chunks FOR EACH ROW EXECUTE PROCEDURE tq_chunks_tsvector_trigger();

-- Agentic Observability Schema (TQ-001)

CREATE TABLE IF NOT EXISTS agentic_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  harness TEXT NOT NULL,
  workspace TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  tags JSONB NULL
);

CREATE TABLE IF NOT EXISTS agentic_session_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES agentic_sessions(id),
  timestamp TIMESTAMP NOT NULL,
  model TEXT NOT NULL,
  surface TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  prompt_summary TEXT NOT NULL,
  tokens_in INTEGER NOT NULL,
  tokens_out INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agentic_context_slices (
  id TEXT PRIMARY KEY,
  session_request_id TEXT NOT NULL REFERENCES agentic_session_requests(id),
  source TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  coverage_score REAL NOT NULL,
  freshness_score REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS agentic_review_events (
  id TEXT PRIMARY KEY,
  session_request_id TEXT NOT NULL REFERENCES agentic_session_requests(id),
  reviewer TEXT NOT NULL,
  result TEXT NOT NULL,
  diff_size_lines INTEGER NOT NULL,
  comments_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agentic_metrics (
  user_id TEXT NOT NULL,
  workspace TEXT NOT NULL,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  prompt_discipline REAL NOT NULL,
  context_health REAL NOT NULL,
  review_rigor REAL NOT NULL,
  skill_reuse REAL NOT NULL,
  drift_index REAL NOT NULL,
  readiness_index REAL NOT NULL,
  PRIMARY KEY (user_id, workspace, window_start, window_end)
);

-- Agentic Observability Indexes (TQ-002)

-- agentic_sessions
CREATE INDEX IF NOT EXISTS idx_agentic_sessions_user_ws_time ON agentic_sessions (user_id, workspace, start_time);
CREATE INDEX IF NOT EXISTS idx_agentic_sessions_end_time ON agentic_sessions (end_time);
CREATE INDEX IF NOT EXISTS idx_agentic_sessions_workspace ON agentic_sessions (workspace);

-- agentic_session_requests
CREATE INDEX IF NOT EXISTS idx_agentic_requests_session ON agentic_session_requests (session_id);
CREATE INDEX IF NOT EXISTS idx_agentic_requests_user_ws_time ON agentic_session_requests (timestamp);
CREATE INDEX IF NOT EXISTS idx_agentic_requests_model ON agentic_session_requests (model);
CREATE INDEX IF NOT EXISTS idx_agentic_requests_prompt_hash ON agentic_session_requests (prompt_hash);

-- agentic_context_slices
CREATE INDEX IF NOT EXISTS idx_agentic_context_request ON agentic_context_slices (session_request_id);
CREATE INDEX IF NOT EXISTS idx_agentic_context_source ON agentic_context_slices (source);

-- agentic_review_events
CREATE INDEX IF NOT EXISTS idx_agentic_reviews_request ON agentic_review_events (session_request_id);
CREATE INDEX IF NOT EXISTS idx_agentic_reviews_reviewer ON agentic_review_events (reviewer);

-- agentic_metrics
CREATE INDEX IF NOT EXISTS idx_agentic_metrics_user_ws_window ON agentic_metrics (user_id, workspace, window_end);
CREATE INDEX IF NOT EXISTS idx_agentic_metrics_drift ON agentic_metrics (drift_index);

-- Materialized View for latest metrics (TQ-016)
CREATE OR REPLACE VIEW agentic_metrics_latest AS
SELECT DISTINCT ON (user_id, workspace)
  user_id,
  workspace,
  window_start,
  window_end,
  prompt_discipline,
  context_health,
  review_rigor,
  skill_reuse,
  drift_index,
  readiness_index
FROM agentic_metrics
ORDER BY user_id, workspace, window_end DESC;
