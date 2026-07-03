// Storage abstraction interface for Knowledge Graph (Phase 29-31 ready)
// Allows backend swap (SQLite → Postgres) without refactoring KG code

export interface KGNode {
  id?: string;
  externalId: string;
  type: string;
  createdAt?: number;
  createdByEventId: string;
  isDeleted?: boolean;
  validFrom: number;
  validTo?: number | null;
  payloadJson: Record<string, unknown>;
  version: number;
  digestId?: number;
}

export interface KGEdge {
  id?: string;
  srcNodeId: number;
  dstNodeId: number;
  type: string;
  createdAt?: number;
  createdByEventId: string;
  isDeleted?: boolean;
  validFrom: number;
  validTo?: number | null;
  payloadJson: Record<string, unknown>;
  version: number;
  digestId?: number;
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

export interface IKGStore {
  // === Node Operations ===
  createNode(node: KGNode): Promise<number>;
  getNode(id: number): Promise<KGNode | null>;
  findNodes(filter: Partial<{ type: string; externalId: string }>): Promise<KGNode[]>;
  getNodeAsOf(externalId: string, timestamp: number): Promise<KGNode | null>;
  findNodesInTimeRange(type: string, validFromMin: number, validToMax: number): Promise<KGNode[]>;

  // === Edge Operations ===
  createEdge(edge: KGEdge): Promise<number>;
  getEdge(id: number): Promise<KGEdge | null>;
  findEdges(filter: Partial<{ srcNodeId: number; dstNodeId: number; type: string }>): Promise<KGEdge[]>;
  getEdgeAsOf(srcNodeId: number, dstNodeId: number, edgeType: string, timestamp: number): Promise<KGEdge | null>;

  // === Digest Chain ===
  appendDigest(digest: DigestEntry): Promise<number>;
  getDigests(): Promise<DigestEntry[]>;

  // === Stats ===
  getStats(): Promise<{
    nodeCount: number;
    edgeCount: number;
    digestCount: number;
    lastIngestionAt: number | null;
  }>;

  // === Lifecycle ===
  close(): void;
}

/**
 * Dual-write adapter (Phase 31)
 * Routes writes to both SQLite (audit) and Postgres (live)
 * Reads come from live store, audit available via audit store separately
 */
export class DualKGStore implements IKGStore {
  constructor(
    private auditStore: IKGStore,   // SQLite: append-only, digest chain
    private liveStore: IKGStore     // Postgres: high-performance, multi-writer
  ) {}

  async createNode(node: KGNode): Promise<number> {
    const [auditId, liveId] = await Promise.all([
      this.auditStore.createNode(node),
      this.liveStore.createNode(node)
    ]);
    return liveId; // Return live store ID for downstream
  }

  async getNode(id: number): Promise<KGNode | null> {
    return this.liveStore.getNode(id);
  }

  async findNodes(filter: Partial<{ type: string; externalId: string }>): Promise<KGNode[]> {
    return this.liveStore.findNodes(filter);
  }

  async getNodeAsOf(externalId: string, timestamp: number): Promise<KGNode | null> {
    return this.liveStore.getNodeAsOf(externalId, timestamp);
  }

  async findNodesInTimeRange(type: string, validFromMin: number, validToMax: number): Promise<KGNode[]> {
    return this.liveStore.findNodesInTimeRange(type, validFromMin, validToMax);
  }

  async createEdge(edge: KGEdge): Promise<number> {
    const [auditId, liveId] = await Promise.all([
      this.auditStore.createEdge(edge),
      this.liveStore.createEdge(edge)
    ]);
    return liveId;
  }

  async getEdge(id: number): Promise<KGEdge | null> {
    return this.liveStore.getEdge(id);
  }

  async findEdges(filter: Partial<{ srcNodeId: number; dstNodeId: number; type: string }>): Promise<KGEdge[]> {
    return this.liveStore.findEdges(filter);
  }

  async getEdgeAsOf(srcNodeId: number, dstNodeId: number, edgeType: string, timestamp: number): Promise<KGEdge | null> {
    return this.liveStore.getEdgeAsOf(srcNodeId, dstNodeId, edgeType, timestamp);
  }

  async appendDigest(digest: DigestEntry): Promise<number> {
    const [auditId, liveId] = await Promise.all([
      this.auditStore.appendDigest(digest),
      this.liveStore.appendDigest(digest)
    ]);
    return auditId; // Audit store is source of truth for digests
  }

  async getDigests(): Promise<DigestEntry[]> {
    // Get digests from audit store (append-only source of truth)
    return this.auditStore.getDigests();
  }

  async getStats(): Promise<{ nodeCount: number; edgeCount: number; digestCount: number; lastIngestionAt: number | null }> {
    return this.liveStore.getStats();
  }

  close(): void {
    this.auditStore.close();
    this.liveStore.close();
  }
}
