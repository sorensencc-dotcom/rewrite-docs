-- Phase 5: Canary State History Table (Append-Only)
-- Tracks canary deployment versions for rollback.

CREATE TABLE IF NOT EXISTS canary_state_history (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,

  -- Deployment version tracking
  current_version VARCHAR(255) NOT NULL,
  previous_version VARCHAR(255),

  -- Event tracking
  event_type VARCHAR(50) NOT NULL, -- 'deployed', 'rolled_back', 'promoted'

  -- Audit
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_canary_state_history_proposal_id ON canary_state_history(proposal_id);
CREATE INDEX idx_canary_state_history_event_type ON canary_state_history(event_type);
