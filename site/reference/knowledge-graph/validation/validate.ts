#!/usr/bin/env node

/**
 * Knowledge Graph Validation Script
 * Checks the generated graph for consistency, completeness, and quality
 *
 * Usage: npx ts-node validate-graph.ts [graph.json]
 */

import * as fs from "fs";
import * as path from "path";

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
  type: string;
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

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

interface ValidationError {
  code: string;
  message: string;
  severity: "critical" | "error";
}

interface ValidationWarning {
  code: string;
  message: string;
  items?: string[];
}

interface ValidationStats {
  totalNodes: number;
  totalEdges: number;
  avgDegree: number;
  maxDegree: number;
  orphanNodes: number;
  selfLoops: number;
  deadNodes: number;
  hubNodes: number;
  categories: string[];
  edgeTypes: string[];
}

class GraphValidator {
  private graph: KnowledgeGraph;
  private nodeIndex: Map<string, GraphNode>;
  private outEdges: Map<string, number>;
  private inEdges: Map<string, number>;

  constructor(graphPath: string) {
    const content = fs.readFileSync(graphPath, "utf-8");
    this.graph = JSON.parse(content);
    this.nodeIndex = new Map();
    this.outEdges = new Map();
    this.inEdges = new Map();
    this.buildIndices();
  }

  private buildIndices() {
    // Index nodes
    for (const node of this.graph.nodes) {
      this.nodeIndex.set(node.id, node);
      this.outEdges.set(node.id, 0);
      this.inEdges.set(node.id, 0);
    }

    // Count edges
    for (const edge of this.graph.edges) {
      this.outEdges.set(edge.source, (this.outEdges.get(edge.source) || 0) + 1);
      this.inEdges.set(edge.target, (this.inEdges.get(edge.target) || 0) + 1);
    }
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Run all validations
    this.checkStructure(errors);
    this.checkNodes(errors, warnings);
    this.checkEdges(errors, warnings);
    this.checkConsistency(errors, warnings);
    this.checkQuality(warnings);

    const stats = this.generateStats();

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats,
    };
  }

  private checkStructure(errors: ValidationError[]) {
    // Check required fields
    if (!this.graph.timestamp) {
      errors.push({
        code: "MISSING_TIMESTAMP",
        message: "Graph is missing timestamp",
        severity: "critical",
      });
    }

    if (!Array.isArray(this.graph.nodes)) {
      errors.push({
        code: "INVALID_NODES",
        message: "Graph.nodes is not an array",
        severity: "critical",
      });
      return;
    }

    if (!Array.isArray(this.graph.edges)) {
      errors.push({
        code: "INVALID_EDGES",
        message: "Graph.edges is not an array",
        severity: "critical",
      });
      return;
    }

    if (!this.graph.metadata || !this.graph.metadata.categories) {
      errors.push({
        code: "INVALID_METADATA",
        message: "Graph is missing metadata.categories",
        severity: "error",
      });
    }
  }

  private checkNodes(errors: ValidationError[], warnings: ValidationWarning[]) {
    const seenIds = new Set<string>();

    for (const node of this.graph.nodes) {
      // Required fields
      if (!node.id) {
        errors.push({
          code: "MISSING_NODE_ID",
          message: `Node missing 'id' field`,
          severity: "critical",
        });
        continue;
      }

      if (!node.label) {
        errors.push({
          code: "MISSING_NODE_LABEL",
          message: `Node ${node.id} missing 'label' field`,
          severity: "error",
        });
      }

      if (!node.category) {
        errors.push({
          code: "MISSING_NODE_CATEGORY",
          message: `Node ${node.id} missing 'category' field`,
          severity: "error",
        });
      }

      if (!node.file) {
        errors.push({
          code: "MISSING_NODE_FILE",
          message: `Node ${node.id} missing 'file' field`,
          severity: "error",
        });
      }

      // Duplicate IDs
      if (seenIds.has(node.id)) {
        errors.push({
          code: "DUPLICATE_NODE_ID",
          message: `Duplicate node ID: ${node.id}`,
          severity: "error",
        });
      }
      seenIds.add(node.id);

      // Invalid characters in ID
      if (!/^[a-zA-Z0-9_]+$/.test(node.id)) {
        warnings.push({
          code: "INVALID_NODE_ID_FORMAT",
          message: `Node ID '${node.id}' contains non-alphanumeric characters`,
        });
      }
    }
  }

  private checkEdges(errors: ValidationError[], warnings: ValidationWarning[]) {
    const seenEdges = new Set<string>();

    for (const edge of this.graph.edges) {
      // Required fields
      if (!edge.source) {
        errors.push({
          code: "MISSING_EDGE_SOURCE",
          message: `Edge missing 'source' field`,
          severity: "error",
        });
        continue;
      }

      if (!edge.target) {
        errors.push({
          code: "MISSING_EDGE_TARGET",
          message: `Edge missing 'target' field`,
          severity: "error",
        });
        continue;
      }

      if (!edge.type) {
        errors.push({
          code: "MISSING_EDGE_TYPE",
          message: `Edge ${edge.source}->${edge.target} missing 'type' field`,
          severity: "error",
        });
      }

      // Source and target must exist
      if (!this.nodeIndex.has(edge.source)) {
        errors.push({
          code: "EDGE_SOURCE_NOT_FOUND",
          message: `Edge references unknown source node: ${edge.source}`,
          severity: "error",
        });
      }

      if (!this.nodeIndex.has(edge.target)) {
        errors.push({
          code: "EDGE_TARGET_NOT_FOUND",
          message: `Edge references unknown target node: ${edge.target}`,
          severity: "error",
        });
      }

      // Self-loops
      if (edge.source === edge.target) {
        warnings.push({
          code: "SELF_LOOP",
          message: `Self-loop detected: ${edge.source} -> ${edge.target}`,
        });
      }

      // Duplicate edges
      const edgeKey = `${edge.source}-${edge.target}-${edge.type}`;
      if (seenEdges.has(edgeKey)) {
        warnings.push({
          code: "DUPLICATE_EDGE",
          message: `Duplicate edge: ${edge.source} -[${edge.type}]-> ${edge.target}`,
        });
      }
      seenEdges.add(edgeKey);
    }
  }

  private checkConsistency(errors: ValidationError[], warnings: ValidationWarning[]) {
    // Check metadata consistency
    const countedCategories: Record<string, number> = {};
    for (const node of this.graph.nodes) {
      countedCategories[node.category] = (countedCategories[node.category] || 0) + 1;
    }

    for (const [category, count] of Object.entries(countedCategories)) {
      const metaCount = this.graph.metadata.categories[category] || 0;
      if (metaCount !== count) {
        warnings.push({
          code: "CATEGORY_COUNT_MISMATCH",
          message: `Category '${category}': metadata says ${metaCount}, found ${count}`,
        });
      }
    }

    // Check edge type counts
    const countedEdgeTypes: Record<string, number> = {};
    for (const edge of this.graph.edges) {
      countedEdgeTypes[edge.type] = (countedEdgeTypes[edge.type] || 0) + 1;
    }

    for (const [type, count] of Object.entries(countedEdgeTypes)) {
      const metaCount = this.graph.metadata.edgeTypes[type] || 0;
      if (metaCount !== count) {
        warnings.push({
          code: "EDGE_TYPE_COUNT_MISMATCH",
          message: `Edge type '${type}': metadata says ${metaCount}, found ${count}`,
        });
      }
    }
  }

  private checkQuality(warnings: ValidationWarning[]) {
    // Find isolated nodes
    const isolated = [];
    for (const [nodeId] of this.nodeIndex) {
      const inDegree = this.inEdges.get(nodeId) || 0;
      const outDegree = this.outEdges.get(nodeId) || 0;
      if (inDegree === 0 && outDegree === 0) {
        isolated.push(nodeId);
      }
    }

    if (isolated.length > 0) {
      warnings.push({
        code: "ISOLATED_NODES",
        message: `Found ${isolated.length} isolated nodes (no edges)`,
        items: isolated.slice(0, 10), // Show first 10
      });
    }

    // Find dead nodes (no incoming edges)
    const dead = [];
    for (const [nodeId] of this.nodeIndex) {
      const inDegree = this.inEdges.get(nodeId) || 0;
      if (inDegree === 0 && (this.outEdges.get(nodeId) || 0) > 0) {
        dead.push(nodeId);
      }
    }

    if (dead.length > 10) {
      warnings.push({
        code: "MANY_DEAD_NODES",
        message: `Found ${dead.length} nodes with no incoming edges (root concepts)`,
      });
    }

    // Find hubs (very high degree)
    const hubs = [];
    for (const [nodeId] of this.nodeIndex) {
      const degree = (this.inEdges.get(nodeId) || 0) + (this.outEdges.get(nodeId) || 0);
      if (degree > 30) {
        hubs.push({ id: nodeId, degree });
      }
    }

    if (hubs.length > 0) {
      warnings.push({
        code: "HUB_NODES",
        message: `Found ${hubs.length} hub nodes with high connectivity`,
        items: hubs.map((h) => `${h.id} (degree: ${h.degree})`),
      });
    }

    // Check graph connectivity
    if (this.graph.nodes.length > 0 && this.graph.edges.length === 0) {
      warnings.push({
        code: "NO_EDGES",
        message: "Graph has nodes but no edges (disconnected)",
      });
    }

    // Check for mostly unused categories
    const categoryDistribution = Object.entries(
      this.graph.metadata.categories
    ).sort((a, b) => b[1] - a[1]);

    const total = categoryDistribution.reduce((sum, [_, count]) => sum + count, 0);
    for (const [category, count] of categoryDistribution) {
      if (count === 1 && total > 50) {
        warnings.push({
          code: "SINGLETON_CATEGORY",
          message: `Category '${category}' has only 1 node`,
        });
      }
    }
  }

  private generateStats(): ValidationStats {
    let totalDegree = 0;
    let maxDegree = 0;
    let orphanCount = 0;
    let selfLoops = 0;
    let deadCount = 0;
    let hubCount = 0;

    for (const [nodeId] of this.nodeIndex) {
      const inDeg = this.inEdges.get(nodeId) || 0;
      const outDeg = this.outEdges.get(nodeId) || 0;
      const degree = inDeg + outDeg;

      totalDegree += degree;
      maxDegree = Math.max(maxDegree, degree);

      if (degree === 0) orphanCount++;
      if (inDeg === 0 && outDeg > 0) deadCount++;
      if (degree > 30) hubCount++;
    }

    for (const edge of this.graph.edges) {
      if (edge.source === edge.target) selfLoops++;
    }

    return {
      totalNodes: this.graph.nodes.length,
      totalEdges: this.graph.edges.length,
      avgDegree: this.graph.nodes.length > 0 ? totalDegree / this.graph.nodes.length : 0,
      maxDegree,
      orphanNodes: orphanCount,
      selfLoops,
      deadNodes: deadCount,
      hubNodes: hubCount,
      categories: Object.keys(this.graph.metadata.categories).sort(),
      edgeTypes: Object.keys(this.graph.metadata.edgeTypes).sort(),
    };
  }
}

// ============================================================================
// CLI Execution
// ============================================================================

function main() {
  const graphPath = process.argv[2] || "graph.json";

  if (!fs.existsSync(graphPath)) {
    console.error(`Error: File not found: ${graphPath}`);
    process.exit(1);
  }

  console.log(`\n📊 Validating Knowledge Graph: ${graphPath}\n`);

  const validator = new GraphValidator(graphPath);
  const result = validator.validate();

  // Print errors
  if (result.errors.length > 0) {
    console.log(`❌ ${result.errors.length} ERROR(S):\n`);
    for (const error of result.errors) {
      const icon = error.severity === "critical" ? "🔴" : "🟠";
      console.log(`${icon} [${error.code}] ${error.message}`);
    }
    console.log();
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log(`⚠️  ${result.warnings.length} WARNING(S):\n`);
    for (const warning of result.warnings) {
      console.log(`🟡 [${warning.code}] ${warning.message}`);
      if (warning.items && warning.items.length > 0) {
        for (const item of warning.items.slice(0, 5)) {
          console.log(`   • ${item}`);
        }
        if (warning.items.length > 5) {
          console.log(`   ... and ${warning.items.length - 5} more`);
        }
      }
    }
    console.log();
  }

  // Print statistics
  console.log(`📈 STATISTICS:\n`);
  const stats = result.stats;
  console.log(`  Nodes:          ${stats.totalNodes}`);
  console.log(`  Edges:          ${stats.totalEdges}`);
  console.log(`  Avg Degree:     ${stats.avgDegree.toFixed(2)}`);
  console.log(`  Max Degree:     ${stats.maxDegree}`);
  console.log(`  Orphan Nodes:   ${stats.orphanNodes}`);
  console.log(`  Dead Nodes:     ${stats.deadNodes}`);
  console.log(`  Hub Nodes:      ${stats.hubNodes}`);
  console.log(`  Categories:     ${stats.categories.length}`);
  console.log(`  Edge Types:     ${stats.edgeTypes.length}`);
  console.log();

  // Print status
  if (result.valid) {
    console.log("✅ Graph is valid!\n");
    process.exit(0);
  } else {
    console.log("❌ Graph validation failed!\n");
    process.exit(1);
  }
}

main();
