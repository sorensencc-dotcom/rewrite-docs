CREATE TABLE evaluation_results (
  id SERIAL PRIMARY KEY,
  policy_version TEXT NOT NULL,
  eval_timestamp BIGINT NOT NULL,
  test_size INT NOT NULL,
  mean_reward FLOAT NOT NULL,
  std_reward FLOAT NOT NULL,
  success_rate FLOAT NOT NULL,
  holdout_dataset TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
