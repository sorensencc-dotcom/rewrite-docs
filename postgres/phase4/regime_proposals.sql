-- Phase 4: Regime Proposals Table (Append-Only)
-- Stores structured regime configuration deltas submitted via DSL.

CREATE TABLE IF NOT EXISTS regime_proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL UNIQUE,
  submitted_by VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Regime delta details
  regime_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL, -- 'update', 'add_parameter'
  parameter_name VARCHAR(255) NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  delta_magnitude NUMERIC,
  delta_percent NUMERIC,

  -- Validation result
  validation_result VARCHAR(50) NOT NULL, -- 'parse_error', 'validation_failed', 'validation_passed'
  validation_errors JSONB,

  -- Governance
  governance_tier VARCHAR(50), -- 'manual', 'auto'
  governance_approved_at TIMESTAMP,

  -- Canary/promotion
  canary_started_at TIMESTAMP,
  canary_completed_at TIMESTAMP,
  promoted_at TIMESTAMP,

  -- Audit
  rationale TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Immutability: append-only
  CONSTRAINT regime_proposals_immutable CHECK (1=1)
);

CREATE INDEX idx_regime_proposals_proposal_id ON regime_proposals(proposal_id);
CREATE INDEX idx_regime_proposals_submitted_at ON regime_proposals(submitted_at);
CREATE INDEX idx_regime_proposals_validation_result ON regime_proposals(validation_result);
