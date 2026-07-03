-- TorqueQuery Schema (Phase 26)
-- SQLite-based memory indexing & semantic search

CREATE TABLE IF NOT EXISTS memory_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  agentId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  correlationId TEXT,
  payload TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  indexedAt TEXT
);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL,
  signalType TEXT NOT NULL,
  value REAL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY(eventId) REFERENCES memory_events(id)
);

CREATE TABLE IF NOT EXISTS correlations (
  id TEXT PRIMARY KEY,
  correlationId TEXT NOT NULL UNIQUE,
  eventIds TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  resolvedAt TEXT
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL UNIQUE,
  lastSeen TEXT NOT NULL,
  eventCount INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS governance_history (
  id TEXT PRIMARY KEY,
  proposalId TEXT NOT NULL,
  voteCount INTEGER,
  decision TEXT,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_timeline (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  eventId TEXT NOT NULL,
  sequence INTEGER,
  timestamp TEXT NOT NULL,
  FOREIGN KEY(eventId) REFERENCES memory_events(id)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_memory_events_type ON memory_events(type);
CREATE INDEX IF NOT EXISTS idx_memory_events_agentId ON memory_events(agentId);
CREATE INDEX IF NOT EXISTS idx_memory_events_correlationId ON memory_events(correlationId);
CREATE INDEX IF NOT EXISTS idx_signals_eventId ON signals(eventId);
CREATE INDEX IF NOT EXISTS idx_agents_agentId ON agents(agentId);
CREATE INDEX IF NOT EXISTS idx_agent_timeline_agentId ON agent_timeline(agentId);
CREATE INDEX IF NOT EXISTS idx_agent_timeline_sequence ON agent_timeline(sequence);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  lineage TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(doc_id);

