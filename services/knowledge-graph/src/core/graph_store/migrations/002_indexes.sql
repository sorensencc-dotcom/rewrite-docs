-- Phase 29.0: Indexes for Knowledge Graph

-- Node indexes
CREATE INDEX IF NOT EXISTS idx_kg_node_external_type ON kg_node(external_id, type);
CREATE INDEX IF NOT EXISTS idx_kg_node_valid_range ON kg_node(type, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_kg_node_digest ON kg_node(digest_id);
CREATE INDEX IF NOT EXISTS idx_kg_node_created_event ON kg_node(created_by_event_id);

-- Edge indexes
CREATE INDEX IF NOT EXISTS idx_kg_edge_src_type ON kg_edge(src_node_id, type);
CREATE INDEX IF NOT EXISTS idx_kg_edge_dst_type ON kg_edge(dst_node_id, type);
CREATE INDEX IF NOT EXISTS idx_kg_edge_valid_range ON kg_edge(type, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_kg_edge_digest ON kg_edge(digest_id);
CREATE INDEX IF NOT EXISTS idx_kg_edge_created_event ON kg_edge(created_by_event_id);

-- Digest indexes
CREATE INDEX IF NOT EXISTS idx_kg_digest_chain ON kg_digest(chain_id, id);
CREATE INDEX IF NOT EXISTS idx_kg_digest_entity ON kg_digest(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_kg_digest_event ON kg_digest(event_id);

-- Cursor index
CREATE INDEX IF NOT EXISTS idx_kg_event_cursor_source ON kg_event_cursor(source);
