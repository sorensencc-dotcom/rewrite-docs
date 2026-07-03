CREATE TABLE policy_promotion_audit (
  id SERIAL PRIMARY KEY,
  checkpoint_id TEXT NOT NULL UNIQUE,
  reviewer_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  justification TEXT,
  metrics_snapshot JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_policy_promotion_audit_checkpoint_id ON policy_promotion_audit(checkpoint_id);
CREATE INDEX idx_policy_promotion_audit_decision ON policy_promotion_audit(decision);
