export type Edge = {
  id: string;
  srcId: string;
  dstId: string;
  type: string;
  createdAt: string;
  properties: Record<string, unknown>;
};

export function validateEdge(edge: unknown): edge is Edge {
  if (!edge || typeof edge !== 'object') return false;
  const e = edge as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.srcId === 'string' &&
    typeof e.dstId === 'string' &&
    typeof e.type === 'string' &&
    typeof e.createdAt === 'string' &&
    typeof e.properties === 'object'
  );
}
