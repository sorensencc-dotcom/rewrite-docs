CREATE TABLE IF NOT EXISTS cic_network_trace (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES cic_audit_log(run_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  dest_ip TEXT NOT NULL,
  dest_port INT NOT NULL,
  protocol TEXT NOT NULL,
  bytes_sent INT NOT NULL,
  bytes_received INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_network_run_id ON cic_network_trace(run_id);
CREATE INDEX IF NOT EXISTS idx_network_dest_ip ON cic_network_trace(dest_ip);
CREATE INDEX IF NOT EXISTS idx_network_ts ON cic_network_trace(timestamp);

CREATE TABLE IF NOT EXISTS cic_syscall_trace (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES cic_audit_log(run_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  syscall TEXT NOT NULL,
  result INT NOT NULL,
  error_code TEXT,
  args_json JSONB
);

CREATE INDEX IF NOT EXISTS idx_syscall_run_id ON cic_syscall_trace(run_id);
CREATE INDEX IF NOT EXISTS idx_syscall_name ON cic_syscall_trace(syscall);
CREATE INDEX IF NOT EXISTS idx_syscall_ts ON cic_syscall_trace(timestamp);

-- TTL / Retention Policy using pg_cron (runs daily at midnight to delete traces older than 30 days)
-- Requires pg_cron extension
-- SELECT cron.schedule('0 0 * * *', $$DELETE FROM cic_network_trace WHERE timestamp < NOW() - INTERVAL '30 days'$$);
-- SELECT cron.schedule('0 0 * * *', $$DELETE FROM cic_syscall_trace WHERE timestamp < NOW() - INTERVAL '30 days'$$);
