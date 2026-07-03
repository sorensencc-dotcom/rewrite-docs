// SQLiteKGStore: Phase 29-31 adapter for GraphStore
// Wraps GraphStore to implement IKGStore interface

import { GraphStore, Node, Edge, DigestEntry as GSDigestEntry } from "./GraphStore";
import { IKGStore, KGNode, KGEdge, DigestEntry } from "./IKGStore";

export class SQLiteKGStore implements IKGStore {
  constructor(private graphStore: GraphStore) {}

  async createNode(node: KGNode): Promise<number> {
    // Map KGNode to GraphStore Node interface
    const gsNode: Node = {
      externalId: node.externalId,
      type: node.type,
      createdAt: Date.now(), // overridden by GraphStore
      createdByEventId: node.createdByEventId,
      isDeleted: node.isDeleted || false,
      validFrom: node.validFrom,
      validTo: node.validTo ?? undefined,
      payloadJson: node.payloadJson,
      version: node.version || 1,
      digestId: 0 // overridden by GraphStore
    };
    return this.graphStore.createNode(gsNode);
  }

  async getNode(id: number): Promise<KGNode | null> {
    const gsNode = await this.graphStore.getNode(id);
    if (!gsNode) return null;
    return this.mapGSNodeToKGNode(gsNode);
  }

  async findNodes(
    filter: Partial<{ type: string; externalId: string }>
  ): Promise<KGNode[]> {
    const gsNodes = await this.graphStore.findNodes(filter);
    return gsNodes.map((n) => this.mapGSNodeToKGNode(n));
  }

  async getNodeAsOf(
    externalId: string,
    timestamp: number
  ): Promise<KGNode | null> {
    const gsNode = await this.graphStore.getNodeAsOf(externalId, timestamp);
    if (!gsNode) return null;
    return this.mapGSNodeToKGNode(gsNode);
  }

  async findNodesInTimeRange(
    type: string,
    validFromMin: number,
    validToMax: number
  ): Promise<KGNode[]> {
    const gsNodes = await this.graphStore.findNodesInTimeRange(
      type,
      validFromMin,
      validToMax
    );
    return gsNodes.map((n) => this.mapGSNodeToKGNode(n));
  }

  async createEdge(edge: KGEdge): Promise<number> {
    const gsEdge: Edge = {
      srcNodeId: edge.srcNodeId,
      dstNodeId: edge.dstNodeId,
      type: edge.type,
      createdAt: Date.now(), // overridden by GraphStore
      createdByEventId: edge.createdByEventId,
      isDeleted: edge.isDeleted || false,
      validFrom: edge.validFrom,
      validTo: edge.validTo ?? undefined,
      payloadJson: edge.payloadJson,
      version: edge.version || 1,
      digestId: 0 // overridden by GraphStore
    };
    return this.graphStore.createEdge(gsEdge);
  }

  async getEdge(id: number): Promise<KGEdge | null> {
    const gsEdge = await this.graphStore.getEdge(id);
    if (!gsEdge) return null;
    return this.mapGSEdgeToKGEdge(gsEdge);
  }

  async findEdges(
    filter: Partial<{ srcNodeId: number; dstNodeId: number; type: string }>
  ): Promise<KGEdge[]> {
    const gsEdges = await this.graphStore.findEdges(filter);
    return gsEdges.map((e) => this.mapGSEdgeToKGEdge(e));
  }

  async getEdgeAsOf(
    srcNodeId: number,
    dstNodeId: number,
    edgeType: string,
    timestamp: number
  ): Promise<KGEdge | null> {
    const gsEdge = await this.graphStore.getEdgeAsOf(
      srcNodeId,
      dstNodeId,
      edgeType,
      timestamp
    );
    if (!gsEdge) return null;
    return this.mapGSEdgeToKGEdge(gsEdge);
  }

  async appendDigest(digest: DigestEntry): Promise<number> {
    // SQLite backend: directly insert digest via raw SQL on underlying DB
    const db = this.graphStore.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO kg_digest
      (chain_id, prev_digest_id, mutation_type, entity_type, entity_id,
       event_id, timestamp, digest_hex, payload_hash_hex, meta_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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
    ) as any;

    return result.lastInsertRowid as number;
  }

  async getDigests(): Promise<DigestEntry[]> {
    const db = this.graphStore.getDatabase();
    const rows = db
      .prepare(`SELECT * FROM kg_digest ORDER BY id ASC`)
      .all() as any[];

    return rows.map((row) => ({
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
      metaJson: row.meta_json ? JSON.parse(row.meta_json) : {}
    }));
  }

  async getStats(): Promise<{
    nodeCount: number;
    edgeCount: number;
    digestCount: number;
    lastIngestionAt: number | null;
  }> {
    return this.graphStore.getStats();
  }

  close(): void {
    this.graphStore.close();
  }

  private mapGSNodeToKGNode(gsNode: Node): KGNode {
    return {
      id: gsNode.id?.toString(),
      externalId: gsNode.externalId,
      type: gsNode.type,
      createdAt: gsNode.createdAt,
      createdByEventId: gsNode.createdByEventId,
      isDeleted: gsNode.isDeleted,
      validFrom: gsNode.validFrom,
      validTo: gsNode.validTo,
      payloadJson: gsNode.payloadJson,
      version: gsNode.version,
      digestId: gsNode.digestId
    };
  }

  private mapGSEdgeToKGEdge(gsEdge: Edge): KGEdge {
    return {
      id: gsEdge.id?.toString(),
      srcNodeId: gsEdge.srcNodeId,
      dstNodeId: gsEdge.dstNodeId,
      type: gsEdge.type,
      createdAt: gsEdge.createdAt,
      createdByEventId: gsEdge.createdByEventId,
      isDeleted: gsEdge.isDeleted,
      validFrom: gsEdge.validFrom,
      validTo: gsEdge.validTo,
      payloadJson: gsEdge.payloadJson,
      version: gsEdge.version,
      digestId: gsEdge.digestId
    };
  }
}
