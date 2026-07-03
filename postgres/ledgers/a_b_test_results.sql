CREATE TABLE a_b_test_results (
  id SERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  cohort_id TEXT NOT NULL,
  spl_action JSONB,
  maal_action JSONB NOT NULL,
  correctness_delta FLOAT,
  cost_delta FLOAT,
  latency_delta FLOAT,
  drift_delta FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_a_b_test_results_timestamp ON a_b_test_results(timestamp);
CREATE INDEX idx_a_b_test_results_cohort_id ON a_b_test_results(cohort_id);
