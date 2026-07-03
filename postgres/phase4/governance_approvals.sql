-- Phase 4: Governance Approvals Table (Append-Only)
-- Records all governance decisions: approvals, rejections, deferrals.
-- TTL: 7 days (proposals marked expired after 7 days).

CREATE TABLE IF NOT EXISTS governance_approvals (
  id BIGSERIAL PRIMARY KEY,
  decision_id VARCHAR(255) NOT NULL UNIQUE,
  proposal_id VARCHAR(255) NOT NULL,

  -- Decision
  decision_type VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'defer'
  decision_status VARCHAR(50) NOT NULL, -- 'approved', 'expired', 'rolled_back'

  -- Approval details
  approved_ranges JSONB, -- {reward_weight: {lower, upper}, cost_delta: {...}, ...}
  cohort_cap NUMERIC, -- governance cap on canary cohort size
  approval_reason TEXT,

  -- Rejection details
  rejection_reason VARCHAR(255),
  rejection_message TEXT,

  -- TTL: governance_ttl_days = 7
  expires_at TIMESTAMP NOT NULL,
  is_expired BOOLEAN DEFAULT FALSE,

  -- Audit
  approver VARCHAR(255),
  reviewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_governance_approvals_proposal_id ON governance_approvals(proposal_id);
CREATE INDEX idx_governance_approvals_decision_type ON governance_approvals(decision_type);
CREATE INDEX idx_governance_approvals_expires_at ON governance_approvals(expires_at);
CREATE INDEX idx_governance_approvals_is_expired ON governance_approvals(is_expired);
