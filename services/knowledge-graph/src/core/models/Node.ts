export type Node = {
  id: string;
  type: string;
  createdAt: string;
  updatedAt?: string;
  labels: Record<string, unknown>;
  properties: Record<string, unknown>;
};

export function validateNode(node: unknown): node is Node {
  if (!node || typeof node !== 'object') return false;
  const n = node as Record<string, unknown>;
  return (
    typeof n.id === 'string' &&
    typeof n.type === 'string' &&
    typeof n.createdAt === 'string' &&
    (n.updatedAt === undefined || typeof n.updatedAt === 'string') &&
    typeof n.labels === 'object' &&
    typeof n.properties === 'object'
  );
}
