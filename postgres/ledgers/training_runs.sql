CREATE TABLE training_runs (
  id SERIAL PRIMARY KEY,
  training_run_id TEXT UNIQUE NOT NULL,
  policy_version TEXT NOT NULL,
  config JSONB NOT NULL,
  start_timestamp BIGINT NOT NULL,
  end_timestamp BIGINT,
  status TEXT,
  final_metric JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
