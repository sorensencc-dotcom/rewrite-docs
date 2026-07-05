---
title: "QUICK START"
summary: "# Knowledge Graph: Quick Start"
created: "2026-07-03T19:43:46.071Z"
updated: "2026-07-03T19:43:46.071Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Knowledge Graph: Quick Start

Extract → Visualize → Query in 5 minutes.

---

## 1. Extract (2 min)

```bash
cd C:\dev\outputs
npx ts-node extract-backlinks.ts C:\dev\cic-ref
```

**Output:** `graph.json` with 280+ nodes, 600+ edges, metadata.

---

## 2. Visualize (1 min)

```bash
# Open in browser (Windows)
start graph-viewer.html

# Or Mac/Linux
open graph-viewer.html
```

**Features:**
- 🎨 Force-directed layout
- 🔍 Search + filtering
- 📊 Interactive sidebar
- 🎯 Click nodes for details

---

## 3. Query in Code (2 min)

```typescript
import { KnowledgeGraphQuery, loadGraphFromFile } from './knowledge-graph-query';

const query = loadGraphFromFile('./graph.json');

// Find what depends on 'agent'
const dependents = query.getNodeDependents('agent');

// Find dependencies of 'phase'
const dependencies = query.getNodeDependencies('phase');

// Find shortest path between concepts
const path = query.findPath('agent', 'observability');

// Find related concepts (cluster)
const cluster = query.getConceptCluster('agent', 2);

// Search concepts
const results = query.search('extract');

// Get statistics
const stats = query.getStats();
```

---

## Files Overview

| File | Purpose | Language |
|------|---------|----------|
| `extract-backlinks.ts` | Parse vault, build graph | TypeScript |
| `knowledge-graph-query.ts` | Query interface (API) | TypeScript |
| `graph-viewer.html` | Interactive visualization | HTML/D3.js |
| `example-skill.ts` | Sample skill using graph | TypeScript |
| `graph.json` | Generated knowledge graph | JSON |

---

## Common Queries

```typescript
const query = loadGraphFromFile('./graph.json');

// What are the most connected concepts?
const hubs = query.getMostConnectedNodes(10);

// What concepts have no dependencies?
const roots = query.getRootConcepts();

// What concepts don't depend on anything?
const leaves = query.getLeafConcepts();

// What's the overall graph structure?
const stats = query.getStats();

// Find all edges of a type
const uses = query.getEdgesByType('uses');

// Search for concepts
const concepts = query.search('extract');

// Get all concepts in a category
const agents = query.getNodesByCategory('agent');
```

---

## Concept Categories

| Category | Color | Example |
|----------|-------|---------|
| `agent` | 🔴 Pink | PR Reviewer, Semantic Search |
| `phase` | 🔵 Teal | Validate, Execute, Review |
| `extractor` | 🟢 Green | CodeFlow, Security Scanner |
| `principle` | 🔴 Pink | Determinism, Forge Field |
| `observability` | 🟡 Orange | Prometheus, Grafana |
| `schema` | 🟣 Purple | Input, Output schemas |
| `token_pack` | 🟢 Green | CIC Design System |
| `api_contract` | 🔴 Red | CodeFlow API |

---

## Edge Types

| Type | Meaning | Color |
|------|---------|-------|
| `implements` | A implements B | 🟢 Green |
| `uses` | A uses B | 🔵 Teal |
| `depends_on` | A depends on B | 🟡 Yellow |
| `extends` | A extends B | 🔴 Pink |
| `describes` | A describes B | 🟢 Green |
| `references` | A references B | ⚫ Gray |

---

## Use Cases

### 1. Document Dependencies
```typescript
// What does the 'agent' concept depend on?
const deps = query.getNodeDependencies('agent');
console.log('Agent depends on:', deps.map(d => d.label));
```

### 2. Impact Analysis
```typescript
// If I change 'phase', what breaks?
const affected = query.getNodeDependents('phase');
console.log('Changing phase affects:', affected.map(a => a.label));
```

### 3. Skill Composition
```typescript
// What skills do I need to implement 'agent'?
const cluster = query.getConceptCluster('agent', 2);
const skills = cluster.nodes.filter(n => n.category === 'extractor');
console.log('Required skills:', skills.map(s => s.label));
```

### 4. Knowledge Discovery
```typescript
// What's related to 'observability'?
const related = query.getConceptCluster('observability', 1);
console.log('Related concepts:', related.nodes.map(n => n.label));
```

### 5. Architecture Validation
```typescript
// What concepts are unused?
const orphans = query.getIsolatedNodes();
if (orphans.length > 0) {
  console.warn('Orphaned concepts:', orphans.map(o => o.label));
}
```

---

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Load graph | ~50ms | Builds indices |
| Get node | <1ms | O(1) lookup |
| Find dependents | ~5ms | Indexed edges |
| Find path (BFS) | ~20ms | Breadth-first search |
| Get cluster | ~15ms | Multi-hop traversal |
| Search | ~10ms | Linear scan (rarely needed) |

---

## Integration Examples

### In a Skill

```typescript
// my-skill/src/index.ts
import { KnowledgeGraphQuery, loadGraphFromFile } from './knowledge-graph-query';

export async function mySkill(input) {
  const query = loadGraphFromFile('./graph.json');
  const dependents = query.getNodeDependents(input.concept);
  
  return { dependents: dependents.map(d => d.label) };
}
```

### In a Next.js API

```typescript
// pages/api/concepts/[id].ts
import { KnowledgeGraphQuery, loadGraphFromFile } from '@/lib/knowledge-graph-query';

export default async function handler(req, res) {
  const { id } = req.query;
  const query = loadGraphFromFile('./public/graph.json');
  const node = query.getNode(id as string);
  const dependents = query.getNodeDependents(id as string);
  
  res.json({ node, dependents });
}
```

### In a CLI Tool

```typescript
#!/usr/bin/env ts-node
import { loadGraphFromFile } from './knowledge-graph-query';

const [cmd, concept] = process.argv.slice(2);
const query = loadGraphFromFile('./graph.json');

switch (cmd) {
  case 'deps':
    console.log(query.getNodeDependencies(concept).map(d => d.label));
    break;
  case 'dependents':
    console.log(query.getNodeDependents(concept).map(d => d.label));
    break;
  case 'path':
    const [from, to] = concept.split('->');
    const path = query.findPath(from.trim(), to.trim());
    console.log(path?.path.map(id => query.getNode(id)?.label).join(' → '));
    break;
}
```

---

## Troubleshooting

### Extraction fails
```bash
# Check vault path
ls -la C:\dev\cic-ref

# Check for .md files
find C:\dev\cic-ref -name "*.md"

# Run with verbose output
NODE_DEBUG=* npx ts-node extract-backlinks.ts
```

### Viewer blank
1. Check `graph.json` exists in same directory as HTML
2. Verify JSON is valid: `node -e "console.log(require('./graph.json'))"`
3. Check browser console (F12) for errors
4. Try opening in different browser (Chrome, Firefox)

### Query returns nothing
```typescript
// Debug
console.log('All nodes:', query.graph.nodes.map(n => n.id));
console.log('All edges:', query.graph.edges.length);

// Try exact ID
const node = query.getNode('agent');
console.log('Found:', node);
```

---

## Next Steps

1. **Extract:** Run extraction script once to generate `graph.json`
2. **Explore:** Open `graph-viewer.html` to visualize
3. **Query:** Import `knowledge-graph-query.ts` in your skill
4. **Automate:** Set up git hooks to update graph on vault changes
5. **Monitor:** Track graph evolution with snapshots

---

## Full Documentation

- **KNOWLEDGE_GRAPH_README.md** — Complete API reference
- **SETUP_GUIDE.md** — Detailed integration guide
- **example-skill.ts** — Working skill implementation
- **knowledge-graph-query.ts** — Source code with comments

---

## Support

Questions? Check:
1. KNOWLEDGE_GRAPH_README.md for API docs
2. SETUP_GUIDE.md for integration patterns
3. example-skill.ts for working code
4. graph-viewer.html for visual exploration

---

**Status:** Production Ready ✅  
**Version:** 1.0.0  
**Last Updated:** 2026-07-02
