CREATE TABLE policy_checkpoints (
  id SERIAL PRIMARY KEY,
  policy_version TEXT UNIQUE NOT NULL,
  training_run_id TEXT NOT NULL,
  epoch INT NOT NULL,
  weights BYTEA NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (training_run_id) REFERENCES training_runs(training_run_id)
);
