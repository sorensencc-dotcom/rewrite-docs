CREATE TABLE training_metrics (
  id SERIAL PRIMARY KEY,
  training_run_id TEXT NOT NULL,
  epoch INT NOT NULL,
  training_loss FLOAT NOT NULL,
  training_reward FLOAT NOT NULL,
  eval_reward FLOAT NOT NULL,
  eval_success_rate FLOAT NOT NULL,
  gradient_norm FLOAT,
  entropy FLOAT,
  timestamp BIGINT NOT NULL,
  FOREIGN KEY (training_run_id) REFERENCES training_runs(training_run_id)
);
