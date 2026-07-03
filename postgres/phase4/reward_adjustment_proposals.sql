-- Phase 4: Reward Adjustment Proposals Table (Append-Only)
-- Stores reward delta proposals submitted via DSL.
-- All reward deltas ALWAYS require canary gate (no direct promotion).

CREATE TABLE IF NOT EXISTS reward_adjustment_proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,
  reward_id VARCHAR(255) NOT NULL,

  -- Reward delta details
  operation VARCHAR(50) NOT NULL, -- 'adjust_weight', 'update_objective', 'add_auxiliary_reward'
  objective_name VARCHAR(255) NOT NULL,
  old_weight NUMERIC,
  new_weight NUMERIC NOT NULL,
  delta_percent NUMERIC,
  bounded_lower NUMERIC NOT NULL,
  bounded_upper NUMERIC NOT NULL,

  -- Validation result
  validation_result VARCHAR(50) NOT NULL,
  validation_errors JSONB,

  -- Governance
  governance_tier VARCHAR(50) DEFAULT 'manual', -- always requires approval for structural
  governance_approved_at TIMESTAMP,

  -- Canary gate (mandatory)
  requires_canary BOOLEAN DEFAULT TRUE,
  canary_started_at TIMESTAMP,
  canary_completed_at TIMESTAMP,
  canary_passed BOOLEAN,

  -- Audit
  submitted_by VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  rationale TEXT,

  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_reward_adjustment_proposals_proposal_id ON reward_adjustment_proposals(proposal_id);
CREATE INDEX idx_reward_adjustment_proposals_requires_canary ON reward_adjustment_proposals(requires_canary);
