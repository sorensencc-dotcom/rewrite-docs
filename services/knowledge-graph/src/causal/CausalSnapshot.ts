export interface KGNode {
  id: string
  type: string
  label?: string
  properties?: Record<string, any>
}

export interface KGEdge {
  src: string
  type: string
  dst: string
  weight?: number
}

export interface KGSnapshot {
  t: number
  getNode(id: string): KGNode | null
  getEdges(id: string): KGEdge[]
  hasEdge(src: string, type: string, dst: string): boolean
  getIncoming(id: string): KGEdge[]
  getOutgoing(id: string): KGEdge[]
}

/**
 * Create snapshot from GraphStore at timestamp.
 * Uses Phase 29 temporal API.
 */
export async function snapshotAt(
  graphStore: any,
  t: number
): Promise<KGSnapshot> {
  const nodes = await graphStore.getNodesAsOf(t)
  const edges = await graphStore.getEdgesAsOf(t)

  const nodeMap = new Map<string, KGNode>(nodes.map((n: any) => [n.id, n]))
  const outgoing = new Map<string, KGEdge[]>()
  const incoming = new Map<string, KGEdge[]>()

  for (const edge of edges) {
    if (!outgoing.has(edge.src)) outgoing.set(edge.src, [])
    if (!incoming.has(edge.dst)) incoming.set(edge.dst, [])
    outgoing.get(edge.src)!.push(edge)
    incoming.get(edge.dst)!.push(edge)
  }

  return {
    t,
    getNode: (id) => nodeMap.get(id) ?? null,
    getEdges: (id) => outgoing.get(id) || [],
    hasEdge: (src, type, dst) =>
      (outgoing.get(src) || []).some(e => e.type === type && e.dst === dst),
    getIncoming: (id) => incoming.get(id) || [],
    getOutgoing: (id) => outgoing.get(id) || []
  }
}
