import React from 'react';

export function RoutingDecisionTree({
  nodes
}: {
  nodes: { id: string; label: string; layer: string; children: string[] }[];
}) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  function renderNode(id: string, depth = 0) {
    const node = byId[id];
    if (!node) return null;

    return (
      <div key={id} style={{ marginLeft: depth * 16 }}>
        <strong>[{node.layer}]</strong> {node.label}
        {node.children.map(childId => renderNode(childId, depth + 1))}
      </div>
    );
  }

  const roots = nodes.filter(n => !nodes.some(m => m.children.includes(n.id)));

  return (
    <div style={{ padding: 16 }}>
      <h2>Routing Decision Tree</h2>
      {roots.map(r => renderNode(r.id))}
    </div>
  );
}
