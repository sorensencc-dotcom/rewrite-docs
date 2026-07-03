import Database from "better-sqlite3";
import * as crypto from "crypto";
import { rowToNode, rowToEdge, rowToDigest } from "./mappers";
import { KG_SCHEMA, KG_INDEXES } from "./schema";

export interface Node {
  id?: number;
  externalId: string;
  type: string;
  createdAt: number;
  createdByEventId: string;
  isDeleted: boolean;
  validFrom: number;
  validTo?: number;
  payloadJson: Record<string, unknown>;
  version: number;
  digestId: number;
}

export interface Edge {
  id?: number;
  srcNodeId: number;
  dstNodeId: number;
  type: string;
  createdAt: number;
  createdByEventId: string;
  isDeleted: boolean;
  validFrom: number;
  validTo?: number;
  payloadJson: Record<string, unknown>;
  version: number;
  digestId: number;
}

export interface DigestEntry {
  id?: number;
  chainId: string;
  prevDigestId?: number;
  mutationType: "create" | "update" | "soft_delete";
  entityType: "node" | "edge";
  entityId: number;
  eventId: string;
  timestamp: number;
  digestHex: string;
  payloadHashHex: string;
  metaJson: Record<string, unknown>;
}

export class GraphStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initializeMigrations();
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  private initializeMigrations(): void {
    this.db.exec(KG_SCHEMA);
    this.db.exec(KG_INDEXES);
  }

  // === Digest Computation ===

  private computePayloadHash(payload: Record<string, unknown>): string {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash("sha256").update(canonical).digest("hex");
  }

  private computeDigest(input: string): string {
    return crypto.createHash("sha256").update(input).digest("hex");
  }

  private buildDigestInput(
    chainId: string,
    prevDigestHex: string | undefined,
    mutationType: string,
    entityType: string,
    entityId: number,
    eventId: string,
    timestamp: number,
    payloadHashHex: string
  ): string {
    return [
      chainId,
      prevDigestHex || "",
      mutationType,
      entityType,
      entityId,
      eventId,
      timestamp,
      payloadHashHex,
    ].join("|");
  }

  // === Node Operations ===

  async createNode(node: Node): Promise<number> {
    const now = Date.now();
    const payloadHashHex = this.computePayloadHash(node.payloadJson);

    return this.db.transaction(() => {
      // Insert node first (with placeholder digest_id = 0)
      const nodeStmt = this.db.prepare(`
        INSERT INTO kg_node
        (external_id, type, created_at, created_by_event_id, is_deleted,
         valid_from, valid_to, payload_json, version, digest_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const nodeResult = nodeStmt.run(
        node.externalId,
        node.type,
        now,
        node.createdByEventId,
        node.isDeleted ? 1 : 0,
        node.validFrom,
        node.validTo || null,
        JSON.stringify(node.payloadJson),
        node.version,
        0 // placeholder
      ) as any;

      const nodeId = nodeResult.lastInsertRowid as number;

      // Get previous digest for chain
      const prevDigest = this.db
        .prepare(
          `SELECT id, digest_hex FROM kg_digest
         WHERE chain_id = ?
         ORDER BY id DESC LIMIT 1`
        )
        .get(`kg_node:${node.externalId}`) as
        | { id: number; digest_hex: string }
        | undefined;

      // Compute digest with actual entity ID
      const digestInput = this.buildDigestInput(
        `kg_node:${node.externalId}`,
        prevDigest?.digest_hex,
        "create",
        "node",
        nodeId,
        node.createdByEventId,
        now,
        payloadHashHex
      );

      const digestHex = this.computeDigest(digestInput);

      // Insert digest
      const digestStmt = this.db.prepare(`
        INSERT INTO kg_digest
        (chain_id, prev_digest_id, mutation_type, entity_type, entity_id,
         event_id, timestamp, digest_hex, payload_hash_hex, meta_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const digestResult = digestStmt.run(
        `kg_node:${node.externalId}`,
        prevDigest?.id || null,
        "create",
        "node",
        nodeId,
        node.createdByEventId,
        now,
        digestHex,
        payloadHashHex,
        JSON.stringify({})
      ) as any;

      const digestId = digestResult.lastInsertRowid;

      // Update node with actual digest_id
      const updateStmt = this.db.prepare(`UPDATE kg_node SET digest_id = ? WHERE id = ?`);
      updateStmt.run(digestId, nodeId);

      return nodeId;
    })();
  }

  async getNode(id: number): Promise<Node | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM kg_node WHERE id = ? AND is_deleted = 0 LIMIT 1`
      )
      .get(id) as any;

    if (!row) return null;

    return rowToNode(row);
  }

  async findNodes(
    filter: Partial<{ type: string; externalId: string }>
  ): Promise<Node[]> {
    let query =
      "SELECT * FROM kg_node WHERE is_deleted = 0";
    const params: any[] = [];

    if (filter.type) {
      query += " AND type = ?";
      params.push(filter.type);
    }

    if (filter.externalId) {
      query += " AND external_id = ?";
      params.push(filter.externalId);
    }

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map(rowToNode);
  }

  // === Edge Operations ===

  async createEdge(edge: Edge): Promise<number> {
    const now = Date.now();
    const payloadHashHex = this.computePayloadHash(edge.payloadJson);

    return this.db.transaction(() => {
      // Insert edge first (with placeholder digest_id = 0)
      const edgeStmt = this.db.prepare(`
        INSERT INTO kg_edge
        (src_node_id, dst_node_id, type, created_at, created_by_event_id,
         is_deleted, valid_from, valid_to, payload_json, version, digest_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const edgeResult = edgeStmt.run(
        edge.srcNodeId,
        edge.dstNodeId,
        edge.type,
        now,
        edge.createdByEventId,
        edge.isDeleted ? 1 : 0,
        edge.validFrom,
        edge.validTo || null,
        JSON.stringify(edge.payloadJson),
        edge.version,
        0 // placeholder
      ) as any;

      const edgeId = edgeResult.lastInsertRowid as number;

      // Get previous digest for chain
      const chainId = `kg_edge:${edge.srcNodeId}-${edge.type}-${edge.dstNodeId}`;
      const prevDigest = this.db
        .prepare(
          `SELECT id, digest_hex FROM kg_digest
         WHERE chain_id = ?
         ORDER BY id DESC LIMIT 1`
        )
        .get(chainId) as { id: number; digest_hex: string } | undefined;

      // Compute digest with actual entity ID
      const digestInput = this.buildDigestInput(
        chainId,
        prevDigest?.digest_hex,
        "create",
        "edge",
        edgeId,
        edge.createdByEventId,
        now,
        payloadHashHex
      );

      const digestHex = this.computeDigest(digestInput);

      // Insert digest
      const digestStmt = this.db.prepare(`
        INSERT INTO kg_digest
        (chain_id, prev_digest_id, mutation_type, entity_type, entity_id,
         event_id, timestamp, digest_hex, payload_hash_hex, meta_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const digestResult = digestStmt.run(
        chainId,
        prevDigest?.id || null,
        "create",
        "edge",
        edgeId,
        edge.createdByEventId,
        now,
        digestHex,
        payloadHashHex,
        JSON.stringify({})
      ) as any;

      const digestId = digestResult.lastInsertRowid;

      // Update edge with actual digest_id
      const updateStmt = this.db.prepare(`UPDATE kg_edge SET digest_id = ? WHERE id = ?`);
      updateStmt.run(digestId, edgeId);

      return edgeId;
    })();
  }

  async getEdge(id: number): Promise<Edge | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM kg_edge WHERE id = ? AND is_deleted = 0 LIMIT 1`
      )
      .get(id) as any;

    if (!row) return null;

    return rowToEdge(row);
  }

  async findEdges(
    filter: Partial<{ srcNodeId: number; dstNodeId: number; type: string }>
  ): Promise<Edge[]> {
    let query = "SELECT * FROM kg_edge WHERE is_deleted = 0";
    const params: any[] = [];

    if (filter.srcNodeId) {
      query += " AND src_node_id = ?";
      params.push(filter.srcNodeId);
    }

    if (filter.dstNodeId) {
      query += " AND dst_node_id = ?";
      params.push(filter.dstNodeId);
    }

    if (filter.type) {
      query += " AND type = ?";
      params.push(filter.type);
    }

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map(rowToEdge);
  }

  // === Temporal Queries ===

  async getNodeAsOf(
    externalId: string,
    timestamp: number
  ): Promise<Node | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM kg_node
       WHERE external_id = ?
       AND is_deleted = 0
       AND valid_from <= ?
       AND (valid_to IS NULL OR valid_to > ?)
       ORDER BY version DESC LIMIT 1`
      )
      .get(externalId, timestamp, timestamp) as any;

    if (!row) return null;

    return rowToNode(row);
  }

  async getEdgeAsOf(
    srcNodeId: number,
    dstNodeId: number,
    edgeType: string,
    timestamp: number
  ): Promise<Edge | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM kg_edge
       WHERE src_node_id = ?
       AND dst_node_id = ?
       AND type = ?
       AND is_deleted = 0
       AND valid_from <= ?
       AND (valid_to IS NULL OR valid_to > ?)
       ORDER BY version DESC LIMIT 1`
      )
      .get(srcNodeId, dstNodeId, edgeType, timestamp, timestamp) as any;

    if (!row) return null;

    return rowToEdge(row);
  }

  async findNodesInTimeRange(
    type: string,
    validFromMin: number,
    validToMax: number
  ): Promise<Node[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM kg_node
       WHERE type = ?
       AND valid_from <= ?
       AND (valid_to IS NULL OR valid_to >= ?)
       AND is_deleted = 0
       ORDER BY valid_from ASC`
      )
      .all(type, validToMax, validFromMin) as any[];

    return rows.map(rowToNode);
  }

  // === Stats ===

  async getStats(): Promise<{
    nodeCount: number;
    edgeCount: number;
    digestCount: number;
    lastIngestionAt: number | null;
  }> {
    const nodeCountRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM kg_node WHERE is_deleted = 0`)
      .get() as any;

    const edgeCountRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM kg_edge WHERE is_deleted = 0`)
      .get() as any;

    const digestCountRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM kg_digest`)
      .get() as any;

    const lastIngestionRow = this.db
      .prepare(
        `SELECT MAX(timestamp) as timestamp FROM kg_digest ORDER BY timestamp DESC LIMIT 1`
      )
      .get() as any;

    return {
      nodeCount: nodeCountRow.count,
      edgeCount: edgeCountRow.count,
      digestCount: digestCountRow.count,
      lastIngestionAt: lastIngestionRow?.timestamp || null,
    };
  }

  close(): void {
    this.db.close();
  }
}
