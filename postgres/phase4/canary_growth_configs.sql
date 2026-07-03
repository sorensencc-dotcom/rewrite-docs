-- Phase 4: Canary Growth Configs Table (Append-Only)
-- Tracks canary growth configuration and decisions across restarts.
-- Read before each growth step to apply latest governance decisions.

CREATE TABLE IF NOT EXISTS canary_growth_configs (
  id BIGSERIAL PRIMARY KEY,
  config_id VARCHAR(255) NOT NULL UNIQUE,
  proposal_id VARCHAR(255) NOT NULL,

  -- Growth curve: fixed sequence [1%, 2%, 5%, 10%]
  growth_curve_json JSONB NOT NULL, -- [0.01, 0.02, 0.05, 0.10]
  current_step INTEGER NOT NULL, -- index into growth_curve
  current_cohort_size NUMERIC NOT NULL,

  -- Governance cap: never exceed
  max_cohort_size NUMERIC NOT NULL,

  -- Observation windows
  observation_window_minutes INTEGER NOT NULL DEFAULT 30,
  observation_windows_required INTEGER NOT NULL DEFAULT 2,

  -- Metric thresholds (read from governance_config.json)
  divergence_threshold NUMERIC NOT NULL,
  cost_delta_threshold NUMERIC NOT NULL,
  latency_delta_threshold NUMERIC NOT NULL,
  correctness_delta_threshold NUMERIC NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL, -- 'active', 'paused', 'halted', 'completed'
  pause_reason TEXT,

  -- Audit trail
  approver VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_canary_growth_configs_proposal_id ON canary_growth_configs(proposal_id);
CREATE INDEX idx_canary_growth_configs_status ON canary_growth_configs(status);
