-- Phase 4: Simulator Drift Reports Table (Append-Only)
-- Stores simulator delta proposals and drift telemetry.
-- All simulator deltas ALWAYS require canary gate.

CREATE TABLE IF NOT EXISTS simulator_drift_reports (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,
  simulator_id VARCHAR(255) NOT NULL,

  -- Simulator delta details
  operation VARCHAR(50) NOT NULL, -- 'adjust_parameter', 'update_coverage', 'recalibrate_model'
  parameter_name VARCHAR(255) NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  delta_percent NUMERIC,
  coverage_threshold NUMERIC,

  -- Validation result
  validation_result VARCHAR(50) NOT NULL,
  validation_errors JSONB,

  -- Drift metrics
  simulator_live_divergence NUMERIC, -- mismatch between sim and live
  drift_threshold NUMERIC DEFAULT 0.10,

  -- Governance
  governance_tier VARCHAR(50) DEFAULT 'manual',
  governance_approved_at TIMESTAMP,

  -- Canary gate (mandatory)
  requires_canary BOOLEAN DEFAULT TRUE,
  canary_started_at TIMESTAMP,
  canary_completed_at TIMESTAMP,

  -- Audit
  submitted_by VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  rationale TEXT,

  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_simulator_drift_reports_proposal_id ON simulator_drift_reports(proposal_id);
CREATE INDEX idx_simulator_drift_reports_divergence ON simulator_drift_reports(simulator_live_divergence);
