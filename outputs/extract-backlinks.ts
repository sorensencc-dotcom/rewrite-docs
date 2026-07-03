#!/usr/bin/env node

/**
 * CIC Vault Knowledge Graph Extractor
 * Extracts [[wiki-links]] backlinks and builds a queryable knowledge graph
 *
 * Usage: ts-node extract-backlinks.ts <vault-path> [output-file]
 */

import * as fs from "fs";
import * as path from "path";

interface VaultFile {
  filePath: string;
  filename: string;
  content: string;
  links: string[];
}

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
 * Extract all [[wiki-links]] from markdown content
 */
function extractWikiLinks(content: string): string[] {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const link = match[1].trim();
    if (link) {
      links.push(link);
    }
  }

  return links;
}

/**
 * Categorize a concept based on filename and content patterns
 */
function categorizeNode(filename: string, content: string): string {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase();

  if (lowerFilename.includes("agent")) return "agent";
  if (lowerFilename.includes("phase") || lowerContent.includes("phase")) return "phase";
  if (lowerFilename.includes("extractor")) return "extractor";
  if (lowerFilename.includes("roadmap") || lowerFilename.includes("milestone"))
    return "roadmap";
  if (lowerFilename.includes("token")) return "token_pack";
  if (lowerContent.includes("determinism")) return "principle";
  if (lowerFilename.includes("observability") || lowerContent.includes("metric"))
    return "observability";
  if (
    lowerContent.includes("security") ||
    lowerContent.includes("permission") ||
    lowerContent.includes("auth")
  )
    return "security";
  if (lowerFilename.includes("api") || lowerContent.includes("endpoint"))
    return "api_contract";
  if (lowerContent.includes("schema") || lowerContent.includes("interface"))
    return "schema";
  if (lowerFilename.includes("pattern")) return "pattern";
  if (lowerFilename.includes("env") || lowerFilename.includes("config"))
    return "configuration";

  return "concept";
}

/**
 * Infer link type based on surrounding context
 */
function inferLinkType(
  source: string,
  target: string,
  context: string
): GraphEdge["type"] {
  const contextLower = context.toLowerCase();

  if (
    contextLower.includes("implements") ||
    contextLower.includes("implement")
  ) {
    return "implements";
  }
  if (
    contextLower.includes("use") ||
    contextLower.includes("calls") ||
    contextLower.includes("call")
  ) {
    return "uses";
  }
  if (
    contextLower.includes("depend") ||
    contextLower.includes("require") ||
    contextLower.includes("required")
  ) {
    return "depends_on";
  }
  if (contextLower.includes("extend") || contextLower.includes("extension")) {
    return "extends";
  }
  if (
    contextLower.includes("describe") ||
    contextLower.includes("definition") ||
    contextLower.includes("explain")
  ) {
    return "describes";
  }

  return "references";
}

/**
 * Get context snippet around a link for better edge type inference
 */
function getLinkContext(content: string, linkName: string): string {
  const wikiLink = `[[${linkName}]]`;
  const index = content.indexOf(wikiLink);

  if (index === -1) return "";

  const start = Math.max(0, index - 100);
  const end = Math.min(content.length, index + linkName.length + 100);

  return content.substring(start, end);
}

/**
 * Parse vault directory and extract files
 */
function parseVault(vaultPath: string): VaultFile[] {
  const files: VaultFile[] = [];
  const extensions = [".md"];

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          walkDir(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const links = extractWikiLinks(content);

            files.push({
              filePath: fullPath,
              filename: entry.name,
              content,
              links,
            });
          } catch (e) {
            console.error(`Failed to read ${fullPath}:`, e);
          }
        }
      }
    }
  }

  walkDir(vaultPath);
  return files;
}

/**
 * Build knowledge graph from vault files
 */
function buildKnowledgeGraph(vaultFiles: VaultFile[]): KnowledgeGraph {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const edgeTypes: Record<string, number> = {};
  const categoryCount: Record<string, number> = {};

  // Create nodes from files and links
  const linkToFiles = new Map<string, string>();

  for (const file of vaultFiles) {
    // Use filename without extension as node ID
    const nodeId = path.basename(file.filename, ".md");
    const category = categorizeNode(file.filename, file.content);

    // Extract first meaningful heading as description
    const headingMatch = file.content.match(/^#+\s+(.+)$/m);
    const description = headingMatch ? headingMatch[1] : undefined;

    if (!nodesMap.has(nodeId)) {
      nodesMap.set(nodeId, {
        id: nodeId,
        label: nodeId
          .replace(/_/g, " ")
          .replace(/-/g, " ")
          .replace(/([A-Z])/g, " $1")
          .trim(),
        category,
        file: file.filename,
        description,
      });

      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }

    // Map link names to file
    linkToFiles.set(nodeId, file.filename);
  }

  // Create edges from link references
  for (const file of vaultFiles) {
    const sourceId = path.basename(file.filename, ".md");

    for (const linkName of file.links) {
      // Normalize link name
      const targetId = linkName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^\w_]/g, "");

      // Only create edge if target exists or could be a reference
      if (nodesMap.has(targetId) || linkToFiles.has(targetId)) {
        const context = getLinkContext(file.content, linkName);
        const linkType = inferLinkType(sourceId, targetId, context);

        edges.push({
          source: sourceId,
          target: targetId,
          type: linkType,
          context: context.slice(0, 200), // Truncate for size
        });

        edgeTypes[linkType] = (edgeTypes[linkType] || 0) + 1;
      } else if (targetId) {
        // Create node for referenced concepts even if not directly documented
        if (!nodesMap.has(targetId)) {
          nodesMap.set(targetId, {
            id: targetId,
            label: linkName
              .replace(/_/g, " ")
              .replace(/-/g, " ")
              .replace(/([A-Z])/g, " $1")
              .trim(),
            category: categorizeNode(linkName, ""),
            file: "inferred",
          });

          categoryCount[
            categorizeNode(linkName, "")
          ] = (categoryCount[categorizeNode(linkName, "")] || 0) + 1;
        }

        edges.push({
          source: sourceId,
          target: targetId,
          type: inferLinkType(sourceId, targetId, file.content),
        });

        edgeTypes[linkType] = (edgeTypes[linkType] || 0) + 1;
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalFiles: vaultFiles.length,
    nodes: Array.from(nodesMap.values()),
    edges,
    metadata: {
      categories: categoryCount,
      edgeTypes,
    },
  };
}

/**
 * Main execution
 */
async function main() {
  const vaultPath = process.argv[2] || "C:\\dev\\cic-ref";
  const outputFile = process.argv[3] || "C:\\dev\\outputs\\graph.json";

  console.log(`Extracting knowledge graph from: ${vaultPath}`);
  console.log(`Output file: ${outputFile}`);

  // Parse vault
  const vaultFiles = parseVault(vaultPath);
  console.log(`Found ${vaultFiles.length} markdown files`);

  // Build graph
  const graph = buildKnowledgeGraph(vaultFiles);
  console.log(`Built graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);

  // Print summary
  console.log("\nCategory Summary:");
  for (const [category, count] of Object.entries(graph.metadata.categories)) {
    console.log(`  ${category}: ${count}`);
  }

  console.log("\nEdge Type Summary:");
  for (const [type, count] of Object.entries(graph.metadata.edgeTypes)) {
    console.log(`  ${type}: ${count}`);
  }

  // Write output
  fs.writeFileSync(outputFile, JSON.stringify(graph, null, 2));
  console.log(`\nGraph saved to ${outputFile}`);

  return graph;
}

main().catch(console.error);
