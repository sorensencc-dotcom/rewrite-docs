/**
 * Example Skill: "Explain Concept"
 * Demonstrates how to use the knowledge graph query interface
 * in a production skill
 */

import { KnowledgeGraphQuery, loadGraphFromFile } from './knowledge-graph-query';

// ============================================================================
// INPUT/OUTPUT SCHEMAS (versioned alongside the skill)
// ============================================================================

interface SkillInput {
  concept: string;
  includeCluster?: boolean;
  maxHops?: number;
}

interface ConceptExplanation {
  found: boolean;
  concept?: {
    id: string;
    label: string;
    category: string;
    description?: string;
    file: string;
  };
  directDependencies?: string[];
  directDependents?: string[];
  relatedConcepts?: string[];
  paths?: {
    to: string;
    distance: number;
    path: string[];
  }[];
  error?: string;
}

// ============================================================================
// QUERY CACHE (singleton per process)
// ============================================================================

let cachedQuery: KnowledgeGraphQuery | null = null;

function getQueryInterface(): KnowledgeGraphQuery {
  if (!cachedQuery) {
    // Load from graph.json (in same directory as this skill)
    cachedQuery = loadGraphFromFile('./graph.json');
  }
  return cachedQuery;
}

// ============================================================================
// SKILL IMPLEMENTATION
// ============================================================================

/**
 * Main skill function
 * Explains a concept by showing its relationships to other concepts
 */
export async function explainConcept(input: SkillInput): Promise<ConceptExplanation> {
  try {
    // Validate input
    if (!input.concept) {
      return {
        found: false,
        error: 'Concept name is required',
      };
    }

    const query = getQueryInterface();

    // Search for the concept (case-insensitive)
    const results = query.search(input.concept);

    if (results.length === 0) {
      return {
        found: false,
        error: `Concept "${input.concept}" not found. Try searching for similar terms.`,
      };
    }

    // Use first match
    const node = results[0];

    // Get relationships
    const dependencies = query.getNodeDependencies(node.id);
    const dependents = query.getNodeDependents(node.id);

    // Get cluster if requested
    const maxHops = input.maxHops ?? 1;
    let cluster = null;
    if (input.includeCluster) {
      cluster = query.getConceptCluster(node.id, maxHops);
    }

    // Build paths to other key concepts
    const paths = buildRelevantPaths(query, node.id);

    return {
      found: true,
      concept: {
        id: node.id,
        label: node.label,
        category: node.category,
        description: node.description,
        file: node.file,
      },
      directDependencies: dependencies.map((d) => d.label),
      directDependents: dependents.map((d) => d.label),
      relatedConcepts: cluster ? cluster.nodes.map((n) => n.label) : undefined,
      paths: paths.length > 0 ? paths : undefined,
    };
  } catch (error) {
    return {
      found: false,
      error: `Error explaining concept: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Helper: Find paths to other important concepts
 */
function buildRelevantPaths(
  query: KnowledgeGraphQuery,
  sourceId: string
): ConceptExplanation['paths'] {
  const stats = query.getStats();
  const hubs = query.getMostConnectedNodes(5);
  const paths = [];

  for (const hub of hubs) {
    if (hub.node.id === sourceId) continue;

    const path = query.findPath(sourceId, hub.node.id);
    if (path && path.distance <= 3) {
      paths.push({
        to: hub.node.label,
        distance: path.distance,
        path: path.path.map((id) => query.getNode(id)?.label || id).filter(Boolean),
      });
    }
  }

  return paths.sort((a, b) => a.distance - b.distance);
}

// ============================================================================
// CLI USAGE (for local testing)
// ============================================================================

if (require.main === module) {
  const concept = process.argv[2] || 'agent';
  const includeCluster = process.argv[3]?.toLowerCase() === 'true';

  explainConcept({
    concept,
    includeCluster,
    maxHops: 2,
  }).then((result) => {
    console.log('\n=== Concept Explanation ===\n');
    console.log(JSON.stringify(result, null, 2));
  });
}

export { SkillInput, ConceptExplanation };
