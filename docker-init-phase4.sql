-- Phase 4: MAAL Codesign + Canary Gates SQL Schemas (Append-Only)
-- Loaded as docker-entrypoint-initdb.d/003-phase4-schemas.sql

\c cic_lineage;

-- Drop existing Phase 4 tables if they exist (for dev/test environments only)
-- Production: use proper migration management
DROP TABLE IF EXISTS canary_growth_configs CASCADE;
DROP TABLE IF EXISTS canary_gate_results CASCADE;
DROP TABLE IF EXISTS governance_approvals CASCADE;
DROP TABLE IF EXISTS simulator_drift_reports CASCADE;
DROP TABLE IF EXISTS reward_adjustment_proposals CASCADE;
DROP TABLE IF EXISTS fallback_graph_proposals CASCADE;
DROP TABLE IF EXISTS constraint_proposals CASCADE;
DROP TABLE IF EXISTS regime_proposals CASCADE;

-- Regime Proposals (append-only)
CREATE TABLE regime_proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL UNIQUE,
  submitted_by VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  regime_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  parameter_name VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  delta_magnitude NUMERIC,
  delta_percent NUMERIC,
  validation_result VARCHAR(50),
  validation_errors JSONB,
  governance_tier VARCHAR(50),
  governance_approved_at TIMESTAMP,
  canary_started_at TIMESTAMP,
  canary_completed_at TIMESTAMP,
  promoted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_regime_proposals_proposal_id ON regime_proposals(proposal_id);
CREATE INDEX idx_regime_proposals_submitted_at ON regime_proposals(submitted_at);
CREATE INDEX idx_regime_proposals_validation_result ON regime_proposals(validation_result);

-- Constraint Proposals (append-only)
CREATE TABLE constraint_proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,
  constraint_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  constraint_type VARCHAR(50),
  old_lower NUMERIC,
  old_upper NUMERIC,
  new_lower NUMERIC,
  new_upper NUMERIC,
  is_safety_critical BOOLEAN DEFAULT FALSE,
  validation_result VARCHAR(50),
  validation_errors JSONB,
  governance_approved_at TIMESTAMP,
  approval_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_constraint_proposals_proposal_id ON constraint_proposals(proposal_id);

-- Fallback Graph Proposals (append-only)
CREATE TABLE fallback_graph_proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  source_regime VARCHAR(255),
  target_regime VARCHAR(255),
  node_id VARCHAR(255),
  weight NUMERIC,
  condition TEXT,
  validation_result VARCHAR(50),
  validation_errors JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_fallback_graph_proposals_proposal_id ON fallback_graph_proposals(proposal_id);

-- Reward Adjustment Proposals (append-only)
CREATE TABLE reward_adjustment_proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,
  reward_id VARCHAR(255) NOT NULL,
  objective_name VARCHAR(255) NOT NULL,
  old_weight NUMERIC,
  new_weight NUMERIC,
  delta_percent NUMERIC,
  bounded_lower NUMERIC,
  bounded_upper NUMERIC,
  governance_tier VARCHAR(50) DEFAULT 'manual',
  requires_canary BOOLEAN DEFAULT TRUE,
  canary_started_at TIMESTAMP,
  canary_completed_at TIMESTAMP,
  canary_passed BOOLEAN,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_reward_adjustment_proposals_proposal_id ON reward_adjustment_proposals(proposal_id);

-- Simulator Drift Reports (append-only)
CREATE TABLE simulator_drift_reports (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,
  simulator_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  parameter_name VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  delta_percent NUMERIC,
  coverage_threshold NUMERIC,
  simulator_live_divergence NUMERIC,
  drift_threshold NUMERIC,
  governance_tier VARCHAR(50) DEFAULT 'manual',
  requires_canary BOOLEAN DEFAULT TRUE,
  canary_started_at TIMESTAMP,
  canary_completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_simulator_drift_reports_proposal_id ON simulator_drift_reports(proposal_id);

-- Governance Approvals (append-only)
CREATE TABLE governance_approvals (
  id BIGSERIAL PRIMARY KEY,
  decision_id VARCHAR(255) NOT NULL UNIQUE,
  proposal_id VARCHAR(255) NOT NULL,
  decision_type VARCHAR(50) NOT NULL,
  approved_ranges JSONB,
  cohort_cap NUMERIC,
  approval_reason TEXT,
  rejection_reason VARCHAR(255),
  rejection_message TEXT,
  expires_at TIMESTAMP,
  is_expired BOOLEAN DEFAULT FALSE,
  approver VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_governance_approvals_proposal_id ON governance_approvals(proposal_id);
CREATE INDEX idx_governance_approvals_decision_type ON governance_approvals(decision_type);
CREATE INDEX idx_governance_approvals_expires_at ON governance_approvals(expires_at);
CREATE INDEX idx_governance_approvals_is_expired ON governance_approvals(is_expired);

-- Canary Gate Results (append-only)
CREATE TABLE canary_gate_results (
  id BIGSERIAL PRIMARY KEY,
  telemetry_id VARCHAR(255) NOT NULL UNIQUE,
  proposal_id VARCHAR(255) NOT NULL,
  cohort_step INTEGER NOT NULL,
  cohort_size NUMERIC NOT NULL,
  observation_start TIMESTAMP NOT NULL,
  observation_end TIMESTAMP NOT NULL,
  observation_duration_minutes INTEGER,
  cost_delta NUMERIC NOT NULL,
  latency_delta NUMERIC NOT NULL,
  correctness_delta NUMERIC NOT NULL,
  divergence NUMERIC NOT NULL,
  error_rate NUMERIC NOT NULL,
  task_success_rate NUMERIC NOT NULL,
  decision VARCHAR(50) NOT NULL,
  decision_reason TEXT,
  soft_violations JSONB,
  hard_violations JSONB,
  promotion_timestamp TIMESTAMP,
  rollback_timestamp TIMESTAMP,
  collected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_canary_gate_results_proposal_id ON canary_gate_results(proposal_id);
CREATE INDEX idx_canary_gate_results_decision ON canary_gate_results(decision);
CREATE INDEX idx_canary_gate_results_cohort_step ON canary_gate_results(cohort_step);

-- Canary Growth Configs (append-only)
CREATE TABLE canary_growth_configs (
  id BIGSERIAL PRIMARY KEY,
  config_id VARCHAR(255) NOT NULL UNIQUE,
  proposal_id VARCHAR(255) NOT NULL,
  growth_curve_json JSONB NOT NULL,
  current_step INTEGER NOT NULL,
  current_cohort_size NUMERIC NOT NULL,
  max_cohort_size NUMERIC NOT NULL,
  observation_window_minutes INTEGER NOT NULL DEFAULT 30,
  observation_windows_required INTEGER NOT NULL DEFAULT 2,
  divergence_threshold NUMERIC NOT NULL,
  cost_delta_threshold NUMERIC NOT NULL,
  latency_delta_threshold NUMERIC NOT NULL,
  correctness_delta_threshold NUMERIC NOT NULL,
  status VARCHAR(50) NOT NULL,
  pause_reason TEXT,
  approver VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_canary_growth_configs_proposal_id ON canary_growth_configs(proposal_id);
CREATE INDEX idx_canary_growth_configs_status ON canary_growth_configs(status);

