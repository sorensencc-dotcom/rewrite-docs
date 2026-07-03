CREATE TABLE shadow_decisions (
  id SERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  task_fingerprint JSONB NOT NULL,
  spl_action JSONB NOT NULL,
  maal_action JSONB NOT NULL,
  divergence_score FLOAT NOT NULL,
  spl_confidence FLOAT NOT NULL,
  regime TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shadow_decisions_timestamp ON shadow_decisions(timestamp);
CREATE INDEX idx_shadow_decisions_regime ON shadow_decisions(regime);
