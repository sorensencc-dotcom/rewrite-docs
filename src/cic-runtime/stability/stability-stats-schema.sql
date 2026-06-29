-- src/cic-runtime/stability/stability-stats-schema.sql

CREATE TABLE IF NOT EXISTS cic_stability_stats (
  model_id TEXT NOT NULL,
  sandbox_tier TEXT NOT NULL,

  avg_drift_score FLOAT NOT NULL,
  slo_violation_rate FLOAT NOT NULL,
  sample_size INT NOT NULL,

  updated_at TIMESTAMPTZ NOT NULL,

  PRIMARY KEY (model_id, sandbox_tier)
);

CREATE INDEX IF NOT EXISTS idx_stability_model
  ON cic_stability_stats(model_id);

CREATE INDEX IF NOT EXISTS idx_stability_sandbox
  ON cic_stability_stats(sandbox_tier);

CREATE INDEX IF NOT EXISTS idx_stability_violation
  ON cic_stability_stats(slo_violation_rate);
