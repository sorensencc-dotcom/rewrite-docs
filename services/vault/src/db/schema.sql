-- Vault Schema (M3)
-- Deterministic governance store with digest verification

CREATE TABLE IF NOT EXISTS vault_records (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  vaultDigest TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vault_secrets (
  id TEXT PRIMARY KEY,
  encryptedValue BLOB NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vault_audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  metadata TEXT
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_vault_records_kind ON vault_records(kind);
CREATE INDEX IF NOT EXISTS idx_vault_records_createdAt ON vault_records(createdAt);
CREATE INDEX IF NOT EXISTS idx_vault_audit_log_action ON vault_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_vault_audit_log_timestamp ON vault_audit_log(timestamp);
