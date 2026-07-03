// Schema definitions (Phase 29.0: Knowledge Graph with append-only, versioned, digest-chained mutations)

export const KG_SCHEMA = `
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
    digest_id INTEGER NOT NULL
  );

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
    FOREIGN KEY (dst_node_id) REFERENCES kg_node(id)
  );

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

  CREATE TABLE IF NOT EXISTS kg_event_cursor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL UNIQUE,
    last_event_id TEXT NOT NULL,
    last_event_timestamp INTEGER NOT NULL,
    meta_json TEXT NOT NULL
  );
`;

export const KG_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_kg_node_external_type ON kg_node(external_id, type);
  CREATE INDEX IF NOT EXISTS idx_kg_node_valid_range ON kg_node(type, valid_from, valid_to);
  CREATE INDEX IF NOT EXISTS idx_kg_node_digest ON kg_node(digest_id);
  CREATE INDEX IF NOT EXISTS idx_kg_node_created_event ON kg_node(created_by_event_id);

  CREATE INDEX IF NOT EXISTS idx_kg_edge_src_type ON kg_edge(src_node_id, type);
  CREATE INDEX IF NOT EXISTS idx_kg_edge_dst_type ON kg_edge(dst_node_id, type);
  CREATE INDEX IF NOT EXISTS idx_kg_edge_valid_range ON kg_edge(type, valid_from, valid_to);
  CREATE INDEX IF NOT EXISTS idx_kg_edge_digest ON kg_edge(digest_id);
  CREATE INDEX IF NOT EXISTS idx_kg_edge_created_event ON kg_edge(created_by_event_id);

  CREATE INDEX IF NOT EXISTS idx_kg_digest_chain ON kg_digest(chain_id, id);
  CREATE INDEX IF NOT EXISTS idx_kg_digest_entity ON kg_digest(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_kg_digest_event ON kg_digest(event_id);

  CREATE INDEX IF NOT EXISTS idx_kg_event_cursor_source ON kg_event_cursor(source);
`;
