-- src/cic-runtime/audit-log/postgres-schema.sql

CREATE TABLE IF NOT EXISTS cic_audit_log (
  run_id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  user_id TEXT,

  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,

  sandbox_tier TEXT NOT NULL,
  isolation_level TEXT NOT NULL,
  determinism TEXT NOT NULL,

  env_hash TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,

  slo_latency_ok BOOLEAN NOT NULL,
  slo_isolation_ok BOOLEAN NOT NULL,
  slo_reliability_ok BOOLEAN NOT NULL,

  drift_score FLOAT NOT NULL,

  violation_type TEXT,

  manifest_json JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cic_model
  ON cic_audit_log(model_id, model_version);

CREATE INDEX IF NOT EXISTS idx_cic_sandbox
  ON cic_audit_log(sandbox_tier);

CREATE INDEX IF NOT EXISTS idx_cic_drift
  ON cic_audit_log(drift_score);

CREATE INDEX IF NOT EXISTS idx_cic_manifest_hash
  ON cic_audit_log(manifest_hash);
