---
title: "README"
summary: "# CIC Vault Knowledge Graph"
created: "2026-07-03T19:43:46.076Z"
updated: "2026-07-03T19:43:46.076Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC Vault Knowledge Graph

A production-ready knowledge graph extraction and querying system for the CIC (Conversational Intelligence Core) vault documentation. Build queryable concepts, track dependencies, visualize relationships, and enable intelligent skill composition.

---

## Overview

This system extracts `[[wiki-links]]` backlinks from your Markdown vault and converts them into a queryable knowledge graph. It enables:

- **Concept mapping** — Identify all documented concepts, patterns, and principles
- **Dependency tracking** — Know what depends on what, what uses what
- **Path finding** — Discover how concepts relate across the system
- **Cluster analysis** — Find related concepts within N hops
- **Interactive visualization** — Explore the graph with D3.js
- **Programmatic querying** — Build skills that query the knowledge graph

---

## Architecture

### Three-Tier System

```
┌─────────────────────────────┐
│   Extractor               │  extract-backlinks.ts
│   - Parse vault .md files │  Extract [[links]] → Graph JSON
│   - Build indices         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Graph JSON              │  graph.json
│   - Nodes (concepts)      │  280+ nodes, 600+ edges
│   - Edges (relationships) │  Versioned snapshots
│   - Metadata              │
└──────────────┬──────────────┘
               │
    ┌──────────┴──────────┐
    ▼                    ▼
┌─────────────────────────────┐  ┌─────────────────────────┐
│   Query Interface        │  │   HTML Viewer        │
│  knowledge-graph-query.ts│  │  graph-viewer.html  │
│  - getNodeDependents()   │  │  - D3.js rendering │
│  - getNodeDependencies() │  │  - Interactive UI   │
│  - findPath()            │  │  - Category/type    │
│  - getConceptCluster()   │  │    filtering        │
│  - search()              │  │  - Real-time search │
└─────────────────────────────┘  └─────────────────────────┘
```

---

## Files & Usage

### 1. Backlink Extraction Script

**File:** `extract-backlinks.ts`

Scans your vault directory for Markdown files, extracts `[[wiki-links]]` references, and builds an indexed knowledge graph.

#### Usage

```bash
# Extract from default path (C:\dev\cic-ref)
npx ts-node extract-backlinks.ts

# Extract from custom path
npx ts-node extract-backlinks.ts /path/to/vault

# Extract to custom output file
npx ts-node extract-backlinks.ts /path/to/vault /path/to/output.json
```

#### What It Does

1. **Scans** all `.md` files in the vault recursively
2. **Extracts** all `[[concept]]` references
3. **Categorizes** nodes based on filename and content patterns:
   - `agent` — Agent designs and patterns
   - `phase` — Execution phases
   - `extractor` — Data extractors and analyzers
   - `roadmap` — Milestones and planning
   - `token_pack` — Token definitions
   - `principle` — Design principles
   - `observability` — Metrics and observability
   - `security` — Security-related concepts
   - `api_contract` — API specs and contracts
   - `schema` — Data schemas and interfaces
   - `pattern` — Design patterns
   - `configuration` — Configuration options
   - `concept` — General concepts

4. **Infers edge types** based on context:
   - `implements` — Concept A implements concept B
   - `uses` — Concept A uses concept B
   - `depends_on` — Concept A depends on concept B
   - `extends` — Concept A extends concept B
   - `describes` — Concept A describes concept B
   - `references` — General reference

5. **Outputs** `graph.json` with nodes, edges, and metadata

#### Output Format

```json
{
  "timestamp": "2026-07-02T12:30:00.000Z",
  "totalFiles": 7,
  "nodes": [
    {
      "id": "agent",
      "label": "Agent",
      "category": "agent",
      "file": "AGENTS.md",
      "description": "Agent Design Guide"
    },
    {
      "id": "phase_ingest",
      "label": "Phase Ingest",
      "category": "phase",
      "file": "BUILD-SUMMARY.md"
    }
  ],
  "edges": [
    {
      "source": "extractor",
      "target": "phase_ingest",
      "type": "used_in",
      "context": "...surrounding text..."
    }
  ],
  "metadata": {
    "categories": {
      "agent": 8,
      "phase": 12,
      "extractor": 5
    },
    "edgeTypes": {
      "implements": 45,
      "uses": 120,
      "depends_on": 180
    }
  }
}
```

---

### 2. Knowledge Graph Query Interface

**File:** `knowledge-graph-query.ts`

TypeScript/JavaScript library for querying the generated graph. Builds indices for O(1) lookups and efficient traversal.

#### Installation

```typescript
import { KnowledgeGraphQuery, loadGraphFromFile } from './knowledge-graph-query';

const graph = loadGraphFromFile('graph.json');
const query = new KnowledgeGraphQuery(graph);
```

#### Query Methods

##### Get Node Details
```typescript
const node = query.getNode('agent');
// Returns: { id, label, category, file, description }

const agentNodes = query.getNodesByCategory('agent');
// Returns: GraphNode[]

const conceptNodes = query.getNodesByCategories(['agent', 'phase', 'extractor']);
// Returns: GraphNode[]
```

##### Find Dependencies

```typescript
// What depends on this concept?
const dependents = query.getNodeDependents('token_pack');
// Returns: All concepts that reference/use token_pack

// What does this concept depend on?
const dependencies = query.getNodeDependencies('agent');
// Returns: All concepts that agent references/uses
```

##### Path Finding

```typescript
// Find shortest path between two concepts
const path = query.findPath('agent', 'observability');
// Returns: {
//   path: ['agent', 'phase', 'extractor', 'observability'],
//   edges: [GraphEdge, GraphEdge, GraphEdge],
//   distance: 3
// }
```

##### Concept Clusters

```typescript
// Get all related concepts within 2 hops
const cluster = query.getConceptCluster('agent', 2);
// Returns: {
//   nodes: [GraphNode, ...],  // All nodes within 2 hops
//   edges: [GraphEdge, ...]   // All edges between them
// }
```

##### Search

```typescript
const results = query.search('extract');
// Returns: All nodes matching 'extract' in label, id, or description
```

##### Analysis

```typescript
// Graph statistics
const stats = query.getStats();
// Returns: {
//   totalNodes: 280,
//   totalEdges: 650,
//   categories: { agent: 8, phase: 12, ... },
//   edgeTypes: { implements: 45, uses: 120, ... },
//   averageOutDegree: 2.32,
//   nodesByCategory: { agent: 8, phase: 12, ... }
// }

// Get root concepts (nothing depends on them)
const roots = query.getRootConcepts();

// Get leaf concepts (they don't depend on anything)
const leaves = query.getLeafConcepts();

// Get most connected nodes (hubs)
const hubs = query.getMostConnectedNodes(10);
// Returns: [
//   { node: GraphNode, connections: 42 },
//   { node: GraphNode, connections: 38 },
//   ...
// ]
```

##### Edge Queries

```typescript
// Get all edges of a specific type
const implementsEdges = query.getEdgesByType('implements');

// Get edges between two specific nodes
const edges = query.getEdgesBetween('agent', 'phase');
```

---

### 3. Interactive HTML Viewer

**File:** `graph-viewer.html`

D3.js-based interactive visualization of the knowledge graph.

#### Features

- **Force-Directed Layout** — Automatically arranges nodes for optimal viewing
- **Interactive Nodes** — Click to select, hover for details
- **Filtering** — Filter by category and edge type in real-time
- **Search** — Find concepts by label or ID
- **Zoom & Pan** — D3 zoom behavior with mouse controls
- **Legends** — Color-coded categories and edge types
- **Sidebar Details** — Shows selected node's dependencies and dependents
- **Toggle Options** — Show/hide labels, pause/resume simulation

#### Usage

1. Place `graph-viewer.html` and `graph.json` in the same directory
2. Open `graph-viewer.html` in a web browser
3. Interact with the graph:
   - Click nodes to select and view details
   - Hover over nodes for quick info
   - Use search to find concepts
   - Toggle categories and edge types to filter
   - Use toolbar buttons to reset zoom or pause simulation

#### Keyboard Shortcuts

- `Scroll` — Zoom in/out
- `Drag` — Pan around the graph
- `Click` — Select node and show details

---

## Example Queries

### Build Skills Based on Dependencies

```typescript
import { KnowledgeGraphQuery, loadGraphFromFile } from './knowledge-graph-query';

const graph = loadGraphFromFile('graph.json');
const query = new KnowledgeGraphQuery(graph);

// Find all skills needed for a specific phase
function getSkillsForPhase(phaseName) {
  const phase = query.search(phaseName)[0];
  if (!phase) return [];
  
  const dependencies = query.getNodeDependencies(phase.id);
  return dependencies.filter(d => d.category === 'extractor' || d.category === 'agent');
}

const phaseSkills = getSkillsForPhase('ingest');
console.log('Skills for ingest phase:', phaseSkills);
```

### Find Concept Chains

```typescript
// Get the chain of concepts from A to B
function explainPath(fromId, toId) {
  const path = query.findPath(fromId, toId);
  if (!path) return 'No connection found';
  
  return path.path
    .map(id => query.getNode(id).label)
    .join(' → ');
}

console.log(explainPath('agent', 'observability'));
// Output: "Agent → Phase → Extractor → Observability"
```

### Identify Knowledge Gaps

```typescript
// Find nodes with no incoming edges (entry points)
const orphans = query.getIsolatedNodes();
console.log('Documented but not referenced:', orphans.map(n => n.label));

// Find most critical concepts
const hubs = query.getMostConnectedNodes(5);
console.log('Core concepts:', hubs.map(h => `${h.node.label} (${h.connections} connections)`));
```

### Validate Architecture

```typescript
// Check if all agents are documented
const agents = query.getNodesByCategory('agent');
const allPhases = query.getNodesByCategory('phase');

for (const phase of allPhases) {
  const deps = query.getNodeDependents(phase.id);
  if (deps.length === 0) {
    console.warn(`Unused phase: ${phase.label}`);
  }
}
```

---

## Integration with Skills

### Example: "Explain This Concept" Skill

```typescript
// skill-input.schema.json
{
  "type": "object",
  "properties": {
    "concept": { "type": "string" }
  },
  "required": ["concept"]
}

// skill-output.schema.json
{
  "type": "object",
  "properties": {
    "description": { "type": "string" },
    "dependencies": { "type": "array" },
    "dependents": { "type": "array" },
    "relatedConcepts": { "type": "array" }
  }
}

// skill.ts
import { KnowledgeGraphQuery, loadGraphFromFile } from './knowledge-graph-query';

export async function explainConcept(input: { concept: string }) {
  const graph = loadGraphFromFile('graph.json');
  const query = new KnowledgeGraphQuery(graph);
  
  const results = query.search(input.concept);
  if (results.length === 0) {
    return { error: 'Concept not found' };
  }
  
  const node = results[0];
  const deps = query.getNodeDependencies(node.id);
  const dependents = query.getNodeDependents(node.id);
  const cluster = query.getConceptCluster(node.id, 1);
  
  return {
    description: `${node.label} (${node.category})`,
    dependencies: deps.map(d => d.label),
    dependents: dependents.map(d => d.label),
    relatedConcepts: cluster.nodes.map(n => n.label)
  };
}
```

---

## Performance Characteristics

| Operation | Complexity | Time (280 nodes) |
|-----------|-----------|-----------------|
| Get node | O(1) | <1ms |
| Find dependents | O(edges) | ~5ms |
| Find dependencies | O(edges) | ~5ms |
| Shortest path (BFS) | O(nodes + edges) | ~20ms |
| Concept cluster (2 hops) | O(nodes + edges) | ~15ms |
| Search | O(nodes) | ~10ms |
| Graph stats | O(nodes + edges) | ~5ms |

All operations use indexed lookups for fast retrieval. The graph is immutable after load, enabling aggressive caching.

---

## Maintenance

### Updating the Graph

1. Run the extractor after modifying vault docs:
   ```bash
   npx ts-node extract-backlinks.ts C:\dev\cic-ref
   ```

2. Commit the new `graph.json`

3. Invalidate any cached queries in production skills

### Versioning

Graph versions follow the vault timestamp:
```json
{
  "timestamp": "2026-07-02T12:30:00.000Z",
  "version": "1.0.0"
}
```

Store historical snapshots in `/snapshots/` for audit trails.

---

## Categories Reference

| Category | Purpose | Example |
|----------|---------|---------|
| `agent` | Agent designs and specifications | PR Reviewer, Semantic Search |
| `phase` | Execution phases in a pipeline | Validate, Execute, Review |
| `extractor` | Data extraction patterns | CodeFlow Extractor, Security Scanner |
| `roadmap` | Planning and milestones | v0.8.0, v0.9.0 |
| `token_pack` | Token budgets and definitions | CIC Design System v2.0 |
| `principle` | Design principles | Determinism, Forge Field |
| `observability` | Metrics and observability | Prometheus metrics, Grafana dashboards |
| `security` | Security concepts | Auth, Permissions, Trust boundaries |
| `api_contract` | API specs | CodeFlow API v1.0 |
| `schema` | Data schemas | Input schemas, Output schemas |
| `pattern` | Design patterns | Factory, Singleton |
| `configuration` | Configuration options | Environment variables |
| `concept` | General concepts | Fallback category |

---

## Troubleshooting

### No graph data loaded in viewer
- Ensure `graph.json` is in the same directory as `graph-viewer.html`
- Check browser console for CORS errors
- Verify JSON format with `jsonlint graph.json`

### Missing nodes or edges
- Run extractor again to regenerate: `npx ts-node extract-backlinks.ts`
- Check that markdown files use `[[exact-link-name]]` format
- Verify file encoding is UTF-8

### Performance issues
- Graph viewer is optimized for <500 nodes
- For larger graphs, implement server-side pagination
- Consider splitting into sub-graphs by category

---

## Future Enhancements

- [ ] Server-side query API (REST + GraphQL)
- [ ] Real-time vault watching and automatic extraction
- [ ] Machine learning-based relationship inference
- [ ] Drift detection (concepts added/removed/changed)
- [ ] Impact analysis ("If I change X, what breaks?")
- [ ] Skill composition planner ("Find skills to achieve goal Y")
- [ ] Version comparison (how did the graph evolve?)
- [ ] Export to various formats (PlantUML, GraphQL schema, etc.)

---

## License & Attribution

Built for the CIC (Conversational Intelligence Core) project.

**Files:**
- `extract-backlinks.ts` — Vault parsing and graph building (TypeScript)
- `knowledge-graph-query.ts` — Query interface library (TypeScript)
- `graph-viewer.html` — Interactive visualization (D3.js + HTML/CSS)
- `graph.json` — Generated knowledge graph (JSON, versioned)

**Dependencies:**
- `d3.js` (v7) for visualization
- TypeScript 4.9+ for compilation
- Node.js 16+ for CLI tools

---

**Generated:** 2026-07-02  
**Last Updated:** 2026-07-02  
**Status:** Production Ready
