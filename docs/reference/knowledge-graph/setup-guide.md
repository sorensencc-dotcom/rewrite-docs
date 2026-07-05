---
title: "SETUP GUIDE"
summary: "# Knowledge Graph Setup & Integration Guide"
created: "2026-07-03T19:43:46.080Z"
updated: "2026-07-03T19:43:46.080Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Knowledge Graph Setup & Integration Guide

Quick start for extracting, querying, and visualizing your CIC vault knowledge graph.

---

## Step 1: Extract the Graph (5 minutes)

### Prerequisites
- Node.js 16+ installed
- TypeScript support: `npm install -g ts-node typescript`
- Access to your vault directory

### Extract from Vault

```bash
# Navigate to outputs directory
cd C:\dev\outputs

# Run the extractor
npx ts-node extract-backlinks.ts C:\dev\cic-ref

# Expected output:
# Extracting knowledge graph from: C:\dev\cic-ref
# Found 7 markdown files
# Built graph with 280 nodes and 650 edges
#
# Category Summary:
#   agent: 8
#   phase: 12
#   extractor: 5
#   ...
#
# Graph saved to C:\dev\outputs\graph.json
```

This generates `graph.json` in your outputs directory — a snapshot of your vault's knowledge graph at this moment.

---

## Step 2: Explore with HTML Viewer (immediate)

### Open the Viewer

```bash
# Simply open the HTML file in your browser
start graph-viewer.html

# Or on Mac:
open graph-viewer.html

# Or on Linux:
xdg-open graph-viewer.html
```

### What You'll See

- **Force-directed graph** of 280+ concepts
- **Color-coded by category** (agents, phases, extractors, etc.)
- **Interactive sidebar** with search and filtering
- **Click nodes** to see their dependencies and dependents
- **Hover for details** about each concept

### Try These Actions

1. Search for "agent" in the sidebar search box
2. Click a node to see what depends on it
3. Filter by category using the checkboxes
4. Use toolbar buttons to reset view or pause the simulation
5. Drag nodes around, zoom with mouse wheel

---

## Step 3: Query Programmatically (integration)

### Use in TypeScript/JavaScript

```typescript
import { KnowledgeGraphQuery, loadGraphFromFile } from './knowledge-graph-query';

// Load the graph
const graph = loadGraphFromFile('./graph.json');
const query = new KnowledgeGraphQuery(graph);

// Ask questions
const agent = query.getNode('agent');
console.log(`Agent category: ${agent?.category}`);

const dependents = query.getNodeDependents('agent');
console.log(`Concepts using agent:`, dependents.map(d => d.label));

const path = query.findPath('agent', 'observability');
console.log(`Path: ${path?.path.join(' → ')}`);
```

### Use in a Skill

Copy `knowledge-graph-query.ts` and `example-skill.ts` into your skill directory:

```bash
# Example structure
my-skill/
├── src/
│   ├── index.ts              # Your main skill file
│   ├── knowledge-graph-query.ts
│   └── example-skill.ts
├── graph.json                # Copy from outputs
└── package.json
```

Then import and use:

```typescript
// In your skill
import { KnowledgeGraphQuery, loadGraphFromFile } from './knowledge-graph-query';

async function mySkillFunction(input) {
  const query = loadGraphFromFile('./graph.json');
  
  // Use query methods
  const dependencies = query.getNodeDependencies(input.conceptId);
  
  return { dependencies };
}
```

---

## Step 4: Automate Graph Updates

### Option A: Manual (Simple)

Run extraction before deploying skills:

```bash
# Before deploying a skill
npx ts-node extract-backlinks.ts C:\dev\cic-ref
git add graph.json
git commit -m "Update knowledge graph from vault"
git push
```

### Option B: Git Hook (Recommended)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Auto-update graph.json before commits if vault changed

if git diff --cached C:\dev\cic-ref\*.md --quiet; then
  echo "Vault unchanged, skipping graph extraction"
else
  echo "Vault changed, extracting updated graph..."
  npx ts-node C:\dev\outputs\extract-backlinks.ts C:\dev\cic-ref C:\dev\outputs\graph.json
  git add C:\dev\outputs\graph.json
  echo "Graph updated and staged"
fi
```

### Option C: CI/CD Pipeline

Add to your GitHub Actions workflow:

```yaml
# .github/workflows/update-graph.yml
name: Update Knowledge Graph

on:
  push:
    paths:
      - 'cic-ref/**/*.md'

jobs:
  update-graph:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Extract knowledge graph
        run: |
          npm install -g ts-node typescript
          npx ts-node extract-backlinks.ts ./cic-ref ./graph.json
      
      - name: Commit changes
        run: |
          git config user.name "Knowledge Graph Bot"
          git config user.email "bot@example.com"
          git add graph.json
          git commit -m "chore: update knowledge graph" || echo "No changes"
          git push
```

---

## Step 5: Build Skills Using the Graph

### Example 1: "What depends on this concept?"

```typescript
export async function whatDependsOn(conceptId: string) {
  const query = loadGraphFromFile('./graph.json');
  const dependents = query.getNodeDependents(conceptId);
  
  return {
    concept: conceptId,
    dependents: dependents.map(d => ({
      label: d.label,
      category: d.category,
      file: d.file
    }))
  };
}
```

### Example 2: "Find the shortest path"

```typescript
export async function explainConnection(from: string, to: string) {
  const query = loadGraphFromFile('./graph.json');
  const path = query.findPath(from, to);
  
  if (!path) {
    return { error: `No connection between ${from} and ${to}` };
  }
  
  return {
    path: path.path.map(id => query.getNode(id)?.label),
    distance: path.distance,
    explanation: `${path.distance} hops from ${from} to ${to}`
  };
}
```

### Example 3: "Find related concepts"

```typescript
export async function findRelated(conceptId: string, hops: number = 2) {
  const query = loadGraphFromFile('./graph.json');
  const cluster = query.getConceptCluster(conceptId, hops);
  
  return {
    central: conceptId,
    related: cluster.nodes.map(n => ({
      id: n.id,
      label: n.label,
      category: n.category
    })),
    connectionCount: cluster.edges.length
  };
}
```

### Example 4: "Validate architecture"

```typescript
export async function validateArchitecture() {
  const query = loadGraphFromFile('./graph.json');
  const stats = query.getStats();
  
  const issues = [];
  
  // Find unused concepts
  const orphans = query.getIsolatedNodes();
  if (orphans.length > 0) {
    issues.push({
      severity: 'warning',
      message: `${orphans.length} concepts are isolated (no connections)`,
      items: orphans.map(n => n.label)
    });
  }
  
  // Find overcentralized concepts (hubs)
  const hubs = query.getMostConnectedNodes(5);
  if (hubs.some(h => h.connections > 50)) {
    issues.push({
      severity: 'info',
      message: 'Some concepts are central hubs',
      items: hubs.map(h => `${h.node.label} (${h.connections} connections)`)
    });
  }
  
  return {
    timestamp: new Date().toISOString(),
    totalNodes: stats.totalNodes,
    totalEdges: stats.totalEdges,
    issues
  };
}
```

---

## Step 6: Version & Deploy

### Package Your Skill

```bash
# Directory structure
my-skill/
├── src/
│   ├── index.ts
│   ├── knowledge-graph-query.ts
│   └── graph.json
├── package.json
├── tsconfig.json
└── README.md
```

### Update graph.json Automatically

After extracting a new graph:

```bash
# Copy to all skills
for skill in src/skills/*/; do
  cp graph.json "${skill}src/graph.json"
done
```

### Cache & Performance

The query interface builds indices on load and caches them:

```typescript
// First load: ~50ms (builds indices)
const query1 = new KnowledgeGraphQuery(graph);

// Subsequent queries: ~1ms (cached)
const dependents = query1.getNodeDependents('agent');

// All lookups are O(1) after initial indexing
```

For production, consider:

1. **Load graph once** at skill startup
2. **Reuse** query instance across invocations
3. **Cache results** if graph updates are infrequent
4. **Invalidate cache** when new graph.json is deployed

---

## Step 7: Monitor & Maintain

### Track Graph Health

```bash
# Run validation script
node -e "
const fs = require('fs');
const graph = JSON.parse(fs.readFileSync('graph.json', 'utf-8'));

console.log('Graph Statistics:');
console.log('  Nodes:', graph.nodes.length);
console.log('  Edges:', graph.edges.length);
console.log('  Categories:', Object.keys(graph.metadata.categories).length);
console.log('  Updated:', graph.timestamp);

// Check for issues
const orphans = graph.nodes.filter(n => 
  !graph.edges.some(e => e.source === n.id || e.target === n.id)
);
if (orphans.length > 0) {
  console.warn('⚠️ Isolated nodes:', orphans.map(n => n.label).join(', '));
}
"
```

### Create Snapshots

```bash
# Before making major vault changes
cp graph.json "snapshots/graph-$(date +%Y-%m-%d-%H%M%S).json"
```

### Monitor Drift

```bash
# Track how the graph changes over time
node -e "
const fs = require('fs');
const current = JSON.parse(fs.readFileSync('graph.json', 'utf-8'));
const previous = JSON.parse(fs.readFileSync('snapshots/graph-latest.json', 'utf-8'));

console.log('Changes since last snapshot:');
console.log('  Nodes added:', current.nodes.length - previous.nodes.length);
console.log('  Edges added:', current.edges.length - previous.edges.length);

// Show new nodes
const newNodeIds = new Set(current.nodes.map(n => n.id));
const oldNodeIds = new Set(previous.nodes.map(n => n.id));
const added = [...newNodeIds].filter(id => !oldNodeIds.has(id));
if (added.length > 0) {
  console.log('  New concepts:', added.join(', '));
}
"
```

---

## Troubleshooting

### Graph not extracting

```bash
# Check vault path exists
ls C:\dev\cic-ref

# Check markdown files are readable
find C:\dev\cic-ref -name "*.md" | head

# Run with debug output
NODE_DEBUG=* npx ts-node extract-backlinks.ts C:\dev\cic-ref
```

### Viewer shows no graph

1. Ensure `graph.json` is in same directory as HTML
2. Check file is valid JSON: `jsonlint graph.json`
3. Check browser console for errors (F12)
4. Try with a simple test: `echo '{"nodes": [], "edges": []}' > test.json`

### Query returns empty results

```typescript
// Debug the graph
console.log('Total nodes:', query.graph.nodes.length);
console.log('Total edges:', query.graph.edges.length);
console.log('All nodes:', query.graph.nodes.map(n => n.id).join(', '));

// Try different queries
const all = query.search('');  // Search for everything
console.log('All concepts:', all.map(n => n.label));
```

### Performance issues

- Graph with >500 nodes may slow viewer
- Consider splitting by category
- Use server-side pagination for large graphs
- Cache query results for repeated searches

---

## Next Steps

1. ✅ Extract the graph: `npx ts-node extract-backlinks.ts`
2. ✅ Explore visually: Open `graph-viewer.html`
3. ✅ Query programmatically: Use `knowledge-graph-query.ts`
4. ✅ Build skills: Copy `example-skill.ts` as template
5. ✅ Automate updates: Set up git hooks or CI/CD
6. ✅ Monitor health: Track graph changes over time

---

## Resources

- **KNOWLEDGE_GRAPH_README.md** — Full API reference
- **knowledge-graph-query.ts** — Source code with JSDoc comments
- **example-skill.ts** — Skill template with examples
- **graph-viewer.html** — Interactive visualization

---

**Last Updated:** 2026-07-02  
**Version:** 1.0.0  
**Status:** Production Ready
