/**
 * Knowledge Graph Query Interface
 * Provides efficient traversal and analysis of the CIC vault knowledge graph
 */

interface GraphNode {
  id: string;
  label: string;
  category: string;
  file: string;
  description?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "implements" | "uses" | "depends_on" | "describes" | "extends" | "references";
  context?: string;
}

interface KnowledgeGraph {
  timestamp: string;
  totalFiles: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    categories: Record<string, number>;
    edgeTypes: Record<string, number>;
  };
}

/**
 * Queryable knowledge graph with indexing for fast lookups
 */
export class KnowledgeGraphQuery {
  private nodeIndex: Map<string, GraphNode>;
  private outgoingEdges: Map<string, GraphEdge[]>;
  private incomingEdges: Map<string, GraphEdge[]>;
  private nodesByCategory: Map<string, GraphNode[]>;
  private graph: KnowledgeGraph;

  constructor(graph: KnowledgeGraph) {
    this.graph = graph;
    this.nodeIndex = new Map();
    this.outgoingEdges = new Map();
    this.incomingEdges = new Map();
    this.nodesByCategory = new Map();

    this.buildIndices();
  }

  /**
   * Build indices for efficient querying
   */
  private buildIndices() {
    // Index nodes
    for (const node of this.graph.nodes) {
      this.nodeIndex.set(node.id, node);

      if (!this.nodesByCategory.has(node.category)) {
        this.nodesByCategory.set(node.category, []);
      }
      this.nodesByCategory.get(node.category)!.push(node);
    }

    // Index edges
    for (const edge of this.graph.edges) {
      if (!this.outgoingEdges.has(edge.source)) {
        this.outgoingEdges.set(edge.source, []);
      }
      this.outgoingEdges.get(edge.source)!.push(edge);

      if (!this.incomingEdges.has(edge.target)) {
        this.incomingEdges.set(edge.target, []);
      }
      this.incomingEdges.get(edge.target)!.push(edge);
    }
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): GraphNode | undefined {
    return this.nodeIndex.get(id);
  }

  /**
   * Get all nodes in a category
   */
  getNodesByCategory(category: string): GraphNode[] {
    return this.nodesByCategory.get(category) || [];
  }

  /**
   * Get all nodes of any of the specified categories
   */
  getNodesByCategories(categories: string[]): GraphNode[] {
    const result: GraphNode[] = [];
    for (const category of categories) {
      result.push(...(this.nodesByCategory.get(category) || []));
    }
    return result;
  }

  /**
   * Get all concepts that depend on a given concept
   * Returns: concepts that reference/use/depend on the target
   */
  getNodeDependents(nodeId: string): GraphNode[] {
    const edges = this.incomingEdges.get(nodeId) || [];
    const dependents = new Set<GraphNode>();

    for (const edge of edges) {
      const node = this.nodeIndex.get(edge.source);
      if (node) {
        dependents.add(node);
      }
    }

    return Array.from(dependents);
  }

  /**
   * Get all concepts that a given concept depends on
   * Returns: concepts this depends on/uses/implements
   */
  getNodeDependencies(nodeId: string): GraphNode[] {
    const edges = this.outgoingEdges.get(nodeId) || [];
    const dependencies = new Set<GraphNode>();

    for (const edge of edges) {
      const node = this.nodeIndex.get(edge.target);
      if (node) {
        dependencies.add(node);
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Find shortest path between two concepts using BFS
   */
  findPath(
    from: string,
    to: string
  ): { path: string[]; edges: GraphEdge[]; distance: number } | null {
    if (!this.nodeIndex.has(from) || !this.nodeIndex.has(to)) {
      return null;
    }

    const visited = new Set<string>();
    const queue: Array<{ node: string; path: string[]; edges: GraphEdge[] }> = [
      { node: from, path: [from], edges: [] },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.node === to) {
        return {
          path: current.path,
          edges: current.edges,
          distance: current.path.length - 1,
        };
      }

      if (visited.has(current.node)) continue;
      visited.add(current.node);

      const outgoing = this.outgoingEdges.get(current.node) || [];
      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          queue.push({
            node: edge.target,
            path: [...current.path, edge.target],
            edges: [...current.edges, edge],
          });
        }
      }
    }

    return null;
  }

  /**
   * Get related concepts within N hops
   */
  getConceptCluster(nodeId: string, maxHops: number = 2): {
    nodes: GraphNode[];
    edges: GraphEdge[];
  } {
    const visitedNodes = new Set<string>();
    const edges: GraphEdge[] = [];
    const queue: Array<{ id: string; hops: number }> = [
      { id: nodeId, hops: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visitedNodes.has(current.id)) continue;
      visitedNodes.add(current.id);

      if (current.hops < maxHops) {
        // Add outgoing edges
        const outgoing = this.outgoingEdges.get(current.id) || [];
        for (const edge of outgoing) {
          edges.push(edge);
          if (!visitedNodes.has(edge.target)) {
            queue.push({ id: edge.target, hops: current.hops + 1 });
          }
        }

        // Add incoming edges
        const incoming = this.incomingEdges.get(current.id) || [];
        for (const edge of incoming) {
          edges.push(edge);
          if (!visitedNodes.has(edge.source)) {
            queue.push({ id: edge.source, hops: current.hops + 1 });
          }
        }
      }
    }

    const nodes = Array.from(visitedNodes)
      .map((id) => this.nodeIndex.get(id))
      .filter((n) => n !== undefined) as GraphNode[];

    return { nodes, edges };
  }

  /**
   * Get all edges of a specific type
   */
  getEdgesByType(
    type: "implements" | "uses" | "depends_on" | "describes" | "extends" | "references"
  ): GraphEdge[] {
    return this.graph.edges.filter((e) => e.type === type);
  }

  /**
   * Get edges between two nodes
   */
  getEdgesBetween(from: string, to: string): GraphEdge[] {
    return this.graph.edges.filter((e) => e.source === from && e.target === to);
  }

  /**
   * Search nodes by label or description
   */
  search(query: string): GraphNode[] {
    const lowerQuery = query.toLowerCase();
    return this.graph.nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(lowerQuery) ||
        node.id.toLowerCase().includes(lowerQuery) ||
        (node.description?.toLowerCase().includes(lowerQuery) ?? false)
    );
  }

  /**
   * Get graph statistics
   */
  getStats() {
    return {
      totalNodes: this.graph.nodes.length,
      totalEdges: this.graph.edges.length,
      categories: this.graph.metadata.categories,
      edgeTypes: this.graph.metadata.edgeTypes,
      averageOutDegree:
        this.graph.edges.length / Math.max(1, this.graph.nodes.length),
      nodesByCategory: Object.fromEntries(
        Array.from(this.nodesByCategory.entries()).map(([cat, nodes]) => [
          cat,
          nodes.length,
        ])
      ),
    };
  }

  /**
   * Get root concepts (no incoming edges)
   */
  getRootConcepts(): GraphNode[] {
    return this.graph.nodes.filter((n) => !this.incomingEdges.has(n.id));
  }

  /**
   * Get leaf concepts (no outgoing edges)
   */
  getLeafConcepts(): GraphNode[] {
    return this.graph.nodes.filter((n) => !this.outgoingEdges.has(n.id));
  }

  /**
   * Get all isolated nodes (no edges)
   */
  getIsolatedNodes(): GraphNode[] {
    return this.graph.nodes.filter(
      (n) =>
        (!this.outgoingEdges.has(n.id) || this.outgoingEdges.get(n.id)!.length === 0) &&
        (!this.incomingEdges.has(n.id) || this.incomingEdges.get(n.id)!.length === 0)
    );
  }

  /**
   * Get the most connected nodes (hubs)
   */
  getMostConnectedNodes(limit: number = 10): Array<{ node: GraphNode; connections: number }> {
    const connectionCounts: Array<{ node: GraphNode; connections: number }> = [];

    for (const node of this.graph.nodes) {
      const outgoing = (this.outgoingEdges.get(node.id) || []).length;
      const incoming = (this.incomingEdges.get(node.id) || []).length;

      connectionCounts.push({
        node,
        connections: outgoing + incoming,
      });
    }

    return connectionCounts.sort((a, b) => b.connections - a.connections).slice(0, limit);
  }

  /**
   * Export as JSON
   */
  toJSON(): KnowledgeGraph {
    return this.graph;
  }
}

// Helper function to load graph from JSON file
export function loadGraphFromFile(filePath: string): KnowledgeGraphQuery {
  const fs = require("fs");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return new KnowledgeGraphQuery(data);
}

// Helper function to load graph from JSON string
export function loadGraphFromJson(json: string): KnowledgeGraphQuery {
  const data = JSON.parse(json);
  return new KnowledgeGraphQuery(data);
}

// Example usage and export
export { GraphNode, GraphEdge, KnowledgeGraph };
