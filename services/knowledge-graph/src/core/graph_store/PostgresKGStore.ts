// PostgresKGStore: Phase 31 Postgres backend for Knowledge Graph
// High-performance multi-writer store for live queries

import { Pool, PoolClient, QueryResult } from "pg";
import { IKGStore, KGNode, KGEdge, DigestEntry } from "./IKGStore";

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  pool?: {
    min: number;
    max: number;
  };
}

export class PostgresKGStore implements IKGStore {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(config: PostgresConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      min: config.pool?.min || 2,
      max: config.pool?.max || 10,
    });
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      await this.initializeTables(client);
      this.initialized = true;
    } finally {
      client.release();
    }
  }

  private async initializeTables(client: PoolClient): Promise<void> {
    // Create tables if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS kg_node (
        id SERIAL PRIMARY KEY,
        external_id TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        created_by_event_id TEXT NOT NULL,
        is_deleted BOOLEAN DEFAULT false,
        valid_from BIGINT NOT NULL,
        valid_to BIGINT,
        payload_json JSONB DEFAULT '{}',
        version INT DEFAULT 1,
        digest_id BIGINT,
        UNIQUE(external_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS kg_edge (
        id SERIAL PRIMARY KEY,
        src_node_id INT NOT NULL REFERENCES kg_node(id),
        dst_node_id INT NOT NULL REFERENCES kg_node(id),
        type TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        created_by_event_id TEXT NOT NULL,
        is_deleted BOOLEAN DEFAULT false,
        valid_from BIGINT NOT NULL,
        valid_to BIGINT,
        payload_json JSONB DEFAULT '{}',
        version INT DEFAULT 1,
        digest_id BIGINT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS kg_digest (
        id BIGSERIAL PRIMARY KEY,
        chain_id TEXT NOT NULL,
        prev_digest_id BIGINT REFERENCES kg_digest(id),
        mutation_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INT NOT NULL,
        event_id TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        digest_hex TEXT NOT NULL,
        payload_hash_hex TEXT NOT NULL,
        meta_json JSONB DEFAULT '{}'
      );
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_kg_node_type ON kg_node(type) WHERE is_deleted = false;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_kg_node_external_id ON kg_node(external_id) WHERE is_deleted = false;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_kg_edge_src ON kg_edge(src_node_id) WHERE is_deleted = false;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_kg_edge_dst ON kg_edge(dst_node_id) WHERE is_deleted = false;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_kg_digest_chain ON kg_digest(chain_id);
    `);
  }

  async createNode(node: KGNode): Promise<number> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `INSERT INTO kg_node
       (external_id, type, created_at, created_by_event_id, is_deleted,
        valid_from, valid_to, payload_json, version, digest_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        node.externalId,
        node.type,
        node.createdAt || Date.now(),
        node.createdByEventId,
        node.isDeleted ? true : false,
        node.validFrom,
        node.validTo || null,
        JSON.stringify(node.payloadJson),
        node.version || 1,
        node.digestId || null
      ]
    );

    return result.rows[0].id;
  }

  async getNode(id: number): Promise<KGNode | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM kg_node WHERE id = $1 AND is_deleted = false LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.rowToNode(result.rows[0]);
  }

  async findNodes(
    filter: Partial<{ type: string; externalId: string }>
  ): Promise<KGNode[]> {
    await this.ensureInitialized();

    let query = "SELECT * FROM kg_node WHERE is_deleted = false";
    const params: any[] = [];

    if (filter.type) {
      query += " AND type = $" + (params.length + 1);
      params.push(filter.type);
    }

    if (filter.externalId) {
      query += " AND external_id = $" + (params.length + 1);
      params.push(filter.externalId);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.rowToNode(row));
  }

  async getNodeAsOf(
    externalId: string,
    timestamp: number
  ): Promise<KGNode | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM kg_node
       WHERE external_id = $1
       AND is_deleted = false
       AND valid_from <= $2
       AND (valid_to IS NULL OR valid_to > $2)
       ORDER BY version DESC LIMIT 1`,
      [externalId, timestamp]
    );

    if (result.rows.length === 0) return null;
    return this.rowToNode(result.rows[0]);
  }

  async findNodesInTimeRange(
    type: string,
    validFromMin: number,
    validToMax: number
  ): Promise<KGNode[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM kg_node
       WHERE type = $1
       AND valid_from <= $2
       AND (valid_to IS NULL OR valid_to >= $3)
       AND is_deleted = false
       ORDER BY valid_from ASC`,
      [type, validToMax, validFromMin]
    );

    return result.rows.map((row) => this.rowToNode(row));
  }

  async createEdge(edge: KGEdge): Promise<number> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `INSERT INTO kg_edge
       (src_node_id, dst_node_id, type, created_at, created_by_event_id,
        is_deleted, valid_from, valid_to, payload_json, version, digest_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        edge.srcNodeId,
        edge.dstNodeId,
        edge.type,
        edge.createdAt || Date.now(),
        edge.createdByEventId,
        edge.isDeleted ? true : false,
        edge.validFrom,
        edge.validTo || null,
        JSON.stringify(edge.payloadJson),
        edge.version || 1,
        edge.digestId || null
      ]
    );

    return result.rows[0].id;
  }

  async getEdge(id: number): Promise<KGEdge | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM kg_edge WHERE id = $1 AND is_deleted = false LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.rowToEdge(result.rows[0]);
  }

  async findEdges(
    filter: Partial<{ srcNodeId: number; dstNodeId: number; type: string }>
  ): Promise<KGEdge[]> {
    await this.ensureInitialized();

    let query = "SELECT * FROM kg_edge WHERE is_deleted = false";
    const params: any[] = [];

    if (filter.srcNodeId) {
      query += " AND src_node_id = $" + (params.length + 1);
      params.push(filter.srcNodeId);
    }

    if (filter.dstNodeId) {
      query += " AND dst_node_id = $" + (params.length + 1);
      params.push(filter.dstNodeId);
    }

    if (filter.type) {
      query += " AND type = $" + (params.length + 1);
      params.push(filter.type);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.rowToEdge(row));
  }

  async getEdgeAsOf(
    srcNodeId: number,
    dstNodeId: number,
    edgeType: string,
    timestamp: number
  ): Promise<KGEdge | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM kg_edge
       WHERE src_node_id = $1
       AND dst_node_id = $2
       AND type = $3
       AND is_deleted = false
       AND valid_from <= $4
       AND (valid_to IS NULL OR valid_to > $4)
       ORDER BY version DESC LIMIT 1`,
      [srcNodeId, dstNodeId, edgeType, timestamp]
    );

    if (result.rows.length === 0) return null;
    return this.rowToEdge(result.rows[0]);
  }

  async appendDigest(digest: DigestEntry): Promise<number> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `INSERT INTO kg_digest
       (chain_id, prev_digest_id, mutation_type, entity_type, entity_id,
        event_id, timestamp, digest_hex, payload_hash_hex, meta_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        digest.chainId,
        digest.prevDigestId || null,
        digest.mutationType,
        digest.entityType,
        digest.entityId,
        digest.eventId,
        digest.timestamp,
        digest.digestHex,
        digest.payloadHashHex,
        JSON.stringify(digest.metaJson)
      ]
    );

    return result.rows[0].id;
  }

  async getDigests(): Promise<DigestEntry[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM kg_digest ORDER BY id ASC`
    );

    return result.rows.map((row) => this.rowToDigest(row));
  }

  async getStats(): Promise<{
    nodeCount: number;
    edgeCount: number;
    digestCount: number;
    lastIngestionAt: number | null;
  }> {
    await this.ensureInitialized();

    const nodeResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM kg_node WHERE is_deleted = false`
    );

    const edgeResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM kg_edge WHERE is_deleted = false`
    );

    const digestResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM kg_digest`
    );

    const lastIngestionResult = await this.pool.query(
      `SELECT MAX(timestamp) as timestamp FROM kg_digest ORDER BY timestamp DESC LIMIT 1`
    );

    return {
      nodeCount: parseInt(nodeResult.rows[0]?.count || 0, 10),
      edgeCount: parseInt(edgeResult.rows[0]?.count || 0, 10),
      digestCount: parseInt(digestResult.rows[0]?.count || 0, 10),
      lastIngestionAt: lastIngestionResult.rows[0]?.timestamp || null
    };
  }

  close(): void {
    this.pool.end();
  }

  private rowToNode(row: any): KGNode {
    return {
      id: row.id?.toString(),
      externalId: row.external_id,
      type: row.type,
      createdAt: row.created_at,
      createdByEventId: row.created_by_event_id,
      isDeleted: row.is_deleted,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      payloadJson: row.payload_json || {},
      version: row.version,
      digestId: row.digest_id
    };
  }

  private rowToEdge(row: any): KGEdge {
    return {
      id: row.id?.toString(),
      srcNodeId: row.src_node_id,
      dstNodeId: row.dst_node_id,
      type: row.type,
      createdAt: row.created_at,
      createdByEventId: row.created_by_event_id,
      isDeleted: row.is_deleted,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      payloadJson: row.payload_json || {},
      version: row.version,
      digestId: row.digest_id
    };
  }

  private rowToDigest(row: any): DigestEntry {
    return {
      id: row.id,
      chainId: row.chain_id,
      prevDigestId: row.prev_digest_id,
      mutationType: row.mutation_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      eventId: row.event_id,
      timestamp: row.timestamp,
      digestHex: row.digest_hex,
      payloadHashHex: row.payload_hash_hex,
      metaJson: row.meta_json || {}
    };
  }
}
