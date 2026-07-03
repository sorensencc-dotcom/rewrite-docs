-- Phase 4: Constraint Proposals Table (Append-Only)
-- Stores constraint delta proposals submitted via DSL.

CREATE TABLE IF NOT EXISTS constraint_proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,
  constraint_id VARCHAR(255) NOT NULL,

  -- Constraint delta details
  operation VARCHAR(50) NOT NULL, -- 'update', 'add', 'weaken', 'strengthen'
  constraint_type VARCHAR(50) NOT NULL, -- 'safety', 'performance', 'correctness'
  old_lower NUMERIC,
  old_upper NUMERIC,
  new_lower NUMERIC,
  new_upper NUMERIC,
  is_safety_critical BOOLEAN DEFAULT FALSE,

  -- Validation result
  validation_result VARCHAR(50) NOT NULL,
  validation_errors JSONB,

  -- Governance
  governance_approved_at TIMESTAMP,
  approval_reason TEXT,

  -- Audit
  submitted_by VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  rationale TEXT,

  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_constraint_proposals_proposal_id ON constraint_proposals(proposal_id);
CREATE INDEX idx_constraint_proposals_constraint_id ON constraint_proposals(constraint_id);
CREATE INDEX idx_constraint_proposals_validation_result ON constraint_proposals(validation_result);
