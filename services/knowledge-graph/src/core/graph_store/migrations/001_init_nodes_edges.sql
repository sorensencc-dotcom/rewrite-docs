-- Phase 29.0: Knowledge Graph schema with append-only, versioned, digest-chained mutations

-- Core node table
CREATE TABLE IF NOT EXISTS kg_node (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by_event_id TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  valid_from INTEGER NOT NULL,
  valid_to INTEGER,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL,
  digest_id INTEGER NOT NULL,
  FOREIGN KEY (digest_id) REFERENCES kg_digest(id)
);

-- Core edge table
CREATE TABLE IF NOT EXISTS kg_edge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  src_node_id INTEGER NOT NULL,
  dst_node_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by_event_id TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  valid_from INTEGER NOT NULL,
  valid_to INTEGER,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL,
  digest_id INTEGER NOT NULL,
  FOREIGN KEY (src_node_id) REFERENCES kg_node(id),
  FOREIGN KEY (dst_node_id) REFERENCES kg_node(id),
  FOREIGN KEY (digest_id) REFERENCES kg_digest(id)
);

-- Digest chain for mutations
CREATE TABLE IF NOT EXISTS kg_digest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chain_id TEXT NOT NULL,
  prev_digest_id INTEGER,
  mutation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  digest_hex TEXT NOT NULL,
  payload_hash_hex TEXT NOT NULL,
  meta_json TEXT NOT NULL,
  FOREIGN KEY (prev_digest_id) REFERENCES kg_digest(id),
  UNIQUE(chain_id, digest_hex)
);

-- Event cursor for idempotent ingestion
CREATE TABLE IF NOT EXISTS kg_event_cursor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL UNIQUE,
  last_event_id TEXT NOT NULL,
  last_event_timestamp INTEGER NOT NULL,
  meta_json TEXT NOT NULL
);
