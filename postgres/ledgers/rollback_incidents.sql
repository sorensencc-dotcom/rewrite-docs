CREATE TABLE rollback_incidents (
  id SERIAL PRIMARY KEY,
  incident_id TEXT UNIQUE NOT NULL,
  trigger_reason TEXT NOT NULL,
  policy_version TEXT,
  rollback_time BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rollback_incidents_incident_id ON rollback_incidents(incident_id);
CREATE INDEX idx_rollback_incidents_trigger_reason ON rollback_incidents(trigger_reason);
CREATE INDEX idx_rollback_incidents_rollback_time ON rollback_incidents(rollback_time);
