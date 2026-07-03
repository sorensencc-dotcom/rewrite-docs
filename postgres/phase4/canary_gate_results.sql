-- Phase 4: Canary Gate Results Table (Append-Only)
-- Records telemetry, decisions, and promotion/rollback outcomes.

CREATE TABLE IF NOT EXISTS canary_gate_results (
  id BIGSERIAL PRIMARY KEY,
  telemetry_id VARCHAR(255) NOT NULL UNIQUE,
  proposal_id VARCHAR(255) NOT NULL,

  -- Canary cohort details
  cohort_step INTEGER NOT NULL, -- which growth step (0-indexed)
  cohort_size NUMERIC NOT NULL, -- decimal: 0.01, 0.02, 0.05, 0.10

  -- Observation window
  observation_start TIMESTAMP NOT NULL,
  observation_end TIMESTAMP NOT NULL,
  observation_duration_minutes INTEGER,

  -- Metrics collected
  cost_delta NUMERIC NOT NULL,
  latency_delta NUMERIC NOT NULL,
  correctness_delta NUMERIC NOT NULL,
  divergence NUMERIC NOT NULL,
  error_rate NUMERIC NOT NULL,
  task_success_rate NUMERIC NOT NULL,

  -- Decision
  decision VARCHAR(50) NOT NULL, -- 'continue', 'promote', 'pause', 'rollback'
  decision_reason TEXT,

  -- Violations detected (soft/hard)
  soft_violations JSONB, -- pause-level
  hard_violations JSONB, -- rollback-level

  -- Outcome
  promotion_timestamp TIMESTAMP,
  rollback_timestamp TIMESTAMP,

  -- Audit
  collected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_canary_gate_results_proposal_id ON canary_gate_results(proposal_id);
CREATE INDEX idx_canary_gate_results_decision ON canary_gate_results(decision);
CREATE INDEX idx_canary_gate_results_cohort_step ON canary_gate_results(cohort_step);
