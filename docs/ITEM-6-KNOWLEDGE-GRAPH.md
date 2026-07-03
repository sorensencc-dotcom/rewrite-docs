---
title: "ITEM 6 KNOWLEDGE GRAPH"
summary: "# ITEM 6: KNOWLEDGE GRAPH **Date:** 2026-07-02 **Purpose:** Vault backlinks → queryable dependency map (extend Item 3) **Status:** Implementation-ready"
created: "2026-07-03T19:43:45.759Z"
updated: "2026-07-03T19:43:45.759Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# ITEM 6: KNOWLEDGE GRAPH
**Date:** 2026-07-02  
**Purpose:** Vault backlinks → queryable dependency map (extend Item 3)  
**Status:** Implementation-ready

---

## OBJECTIVE

Build a queryable knowledge graph that answers:
- **Impact queries:** "If I change Phase 18 timeline, what breaks?"
- **Discovery queries:** "How are tokens and cost related?"
- **Compliance queries:** "What changed between Phase 17 and 18?"
- **Planning queries:** "What's the critical path to production?"

Unlike Item 3 (system map), the knowledge graph focuses on **semantic relationships** and **impact propagation**.

---

## GRAPH STRUCTURE

### Node Types

```
Doc Node
├── id: "cic-ref/BUILD-SUMMARY"
├── type: "doc"
├── title: "CIC Build Summary"
├── phase: "production"
├── status: "operational"
├── sections: ["Architecture", "Deployment", "Testing"]
├── tags: ["architecture", "production-ready", "canonical"]
└── content_hash: "sha256:abc123..."

Skill Node
├── id: "cic-env-validator"
├── type: "skill"
├── name: "CIC Env Validator"
├── reads: ["cic-ref/CIC_ENV_REFERENCE"]
├── emits: ["validation_report"]
└── maturity: "alpha"

Concept Node
├── id: "token_strategy"
├── type: "concept"
├── label: "Token Management"
├── docs: ["cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST", "cic-ref/ROADMAP"]
└── tags: ["cost", "optimization"]

Event Node
├── id: "phase-18-start"
├── type: "event"
├── phase: 18
├── timestamp: "2026-06-20T00:00:00Z"
├── description: "Parallel Observability Track"
└── docs_touched: ["cic-ref/OBSERVABILITY_PLAN"]
```

### Edge Types

```
"references" → Doc A links to Doc B (wikilink)
"implements" → Skill reads/uses Doc (skill depends on doc)
"depends_on" → Doc A requires Doc B before executing
"contradicts" → Doc A contradicts Doc B (flag for review)
"refines" → Doc B is more detailed version of Doc A concept
"tagged_with" → Node has semantic tag (cost, performance, etc.)
"changed_at" → Node changed during event (phase, release, etc.)
"affects" → Changing A likely affects B (inferred from dependency graph)
```

---

## SEMANTIC ENRICHMENT (AI-Generated)

After structural extraction, run semantic analysis:

### Phase 1: Concept Extraction
```
Input: cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST.md
Extract concepts:
  - "Token pricing" (tokens → cost)
  - "Context window" (model capability)
  - "Batching" (throughput optimization)
  - "Caching" (cost reduction)
Output: Concept nodes + doc cross-references
```

### Phase 2: Relationship Inference
```
If doc A mentions "token" AND doc B discusses "cost":
  → Infer edge: A "affects" B (type: "semantic_cost_related")

If skill X reads doc A AND skill Y reads doc B:
  → Infer edge: X "shares_context" with Y
```

### Phase 3: Impact Analysis
```
Query: "If I change BUILD-SUMMARY's deployment section..."
→ Follow edges: doc → skills → other docs
→ Compute: affected_skills, affected_phases, risk_level
→ Return: Impact tree
```

---

## GRAPH DATA MODEL

```json
{
  "metadata": {
    "generated": "2026-07-02T16:45:00Z",
    "version": "1.0.0",
    "nodes": 50,
    "edges": 180,
    "semantic_edges": 67,
    "last_updated": "2026-07-02T10:42:39Z",
    "format": "neo4j-export | json-ld"
  },

  "nodes": [
    {
      "id": "cic-ref/BUILD-SUMMARY",
      "type": "doc",
      "attributes": {
        "title": "CIC Build Summary",
        "phase": "production",
        "status": "operational",
        "sections": ["Architecture", "Deployment", "Testing"],
        "tags": ["architecture", "canonical"],
        "content_hash": "sha256:abc123",
        "last_modified": "2026-06-24"
      },
      "embeddings": {
        "title": [0.1, 0.2, ...],  // Vector embedding for similarity search
        "content": [0.3, 0.4, ...]
      }
    },
    {
      "id": "token_strategy",
      "type": "concept",
      "attributes": {
        "label": "Token Management Strategy",
        "description": "How to optimize token usage and costs",
        "related_docs": [
          "cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST",
          "cic-ref/ROADMAP",
          "cic-ref/OBSERVABILITY_PLAN"
        ],
        "importance": 0.95
      }
    }
  ],

  "edges": [
    {
      "source": "cic-ref/BUILD-SUMMARY",
      "target": "cic-ref/OBSERVABILITY_PLAN",
      "type": "references",
      "weight": 1.0,
      "context": "Observability enables runtime metrics"
    },
    {
      "source": "cic-env-validator",
      "target": "cic-ref/CIC_ENV_REFERENCE",
      "type": "implements",
      "weight": 1.0,
      "reads_sections": ["Requires", "Validation Rules"]
    },
    {
      "source": "cic-ref/ROADMAP",
      "target": "token_strategy",
      "type": "refines",
      "weight": 0.8,
      "semantic": true
    },
    {
      "source": "phase-18-start",
      "target": "cic-ref/OBSERVABILITY_PLAN",
      "type": "changed_at",
      "timestamp": "2026-06-20T00:00:00Z"
    }
  ]
}
```

---

## QUERY ENGINE (GraphQL + SQL)

### Query 1: Impact Analysis
```graphql
query ImpactOfChange {
  node(id: "cic-ref/ROADMAP") {
    id
    title
    directDependents {
      id
      type
      relationship
    }
    transitiveImpact(depth: 3) {
      affected_nodes
      risk_level
      critical_path
    }
  }
}

# Returns:
{
  "id": "cic-ref/ROADMAP",
  "directDependents": [
    {"id": "run-cic-pipeline", "relationship": "queries"},
    {"id": "plan-extractor-integration", "relationship": "queries"}
  ],
  "transitiveImpact": {
    "affected_nodes": 8,
    "risk_level": "HIGH",
    "critical_path": [
      "ROADMAP → run-cic-pipeline → PostgreSQL (queries stored phases)",
      "ROADMAP → extractor-orchestrator → Qdrant (depends on phase config)"
    ]
  }
}
```

### Query 2: Concept Discovery
```graphql
query FindRelatedConcepts {
  concept(name: "token_strategy") {
    related_docs {
      doc_id
      relevance_score
      connection_type
    }
    similar_concepts {
      concept_name
      similarity: 0.87
    }
  }
}

# Returns:
{
  "related_docs": [
    {"doc": "CIC_TOKEN_PACK", "relevance": 1.0, "type": "direct"},
    {"doc": "OBSERVABILITY_PLAN", "relevance": 0.75, "type": "cost_related"},
    {"doc": "ROADMAP", "relevance": 0.68, "type": "semantic"}
  ],
  "similar_concepts": [
    {"concept": "cost_optimization", "similarity": 0.92}
  ]
}
```

### Query 3: Change Timeline
```sql
SELECT 
  e.timestamp,
  e.phase,
  n.id,
  n.type,
  COUNT(*) as changes_in_phase
FROM events e
JOIN changed_nodes cn ON e.id = cn.event_id
JOIN nodes n ON cn.node_id = n.id
WHERE e.phase IN (17, 18)
GROUP BY e.phase, n.type
ORDER BY e.timestamp DESC;

# Returns:
phase | type | changes | nodes_affected
------|------|---------|---------------
  18  | doc  |    4    | OBSERVABILITY_PLAN, AGENTS, ...
  18  | skill|    2    | cic-env-validator, cic-deploy-checklist
  17  | doc  |    2    | BUILD-SUMMARY, ROADMAP
```

### Query 4: Critical Path
```graphql
query CriticalPath {
  criticalPath(from: "design", to: "production") {
    nodes
    edges
    dependencies_count
    estimated_duration
  }
}

# Returns:
{
  "path": [
    "BUILD-SUMMARY (architecture design)",
    "ROADMAP (phase planning)",
    "OBSERVABILITY_PLAN (metrics setup)",
    "deployment validation",
    "production"
  ],
  "dependencies": 12,
  "critical_edges": 5  # Changes here would block entire path
}
```

---

## IMPLEMENTATION STEPS

### Step 1: Extract Vault Structure (Item 3 output)
**Input:** system-map.json from Item 3  
**Output:** node_list.csv, edge_list.csv

### Step 2: Add Semantic Enrichment (20 min)
- Run concept extraction on doc content
- Identify semantic relationships (token→cost, phase→timeline)
- Generate concept nodes
- Infer "affects" edges

**Script: enrich-knowledge-graph.ts**
```typescript
// Read system-map.json
// For each doc, extract embeddings (use Anthropic API)
// Find concept mentions (token, cost, phase, etc.)
// Link concepts to docs
// Infer edges based on embeddings similarity
```

### Step 3: Build Query Engine (30 min)

**Option A: Neo4j (Recommended)**
- Import nodes/edges via Cypher LOAD CSV
- Query via Cypher or GraphQL endpoint
- Visualization: Neo4j Browser or Graphviz

**Option B: SQLite + SQL**
- Create tables: nodes, edges, concepts, events
- Query via SQL + computed columns
- Visualization: GraphQL API → frontend

**Option C: JSON + JS (Lightweight)**
- Embed graph in JSON
- Query via lodash + recursive walks
- Visualization: D3.js or Graphviz

### Step 4: Validate & Visualize (20 min)
- Run sample queries (impact, concepts, timeline)
- Render as SVG/HTML
- Check for cycles, orphans, incorrect inferences

### Step 5: Integrate with Item 7 (Memory Governance)
- **Vault:** Store stable architecture graph
- **Memory:** Store recent query results (don't cache)
- **Living docs:** Store last-updated timestamp + change log

---

## OUTPUTS

- [ ] `knowledge-graph.json` — Full graph with semantics
- [ ] `knowledge-graph.cypher` — Neo4j import script
- [ ] `knowledge-graph.sql` — SQLite schema + data
- [ ] `graph-queries.md` — Runnable query examples
- [ ] `graph-visualization.svg` — Rendered graph
- [ ] `change-timeline.csv` — Phase-by-phase changes

---

## INTEGRATION WITH OTHER ITEMS

### With Item 2 (Dashboard)
- Dashboard panel: "Knowledge Graph Browser"
- Query: "Show all metrics that affect System Health"
- Display: Interactive graph widget

### With Item 3 (System Map)
- System map is **structural** (what exists)
- Knowledge graph is **semantic** (what means what, how things relate)
- Both queryable, complementary views

### With Item 5 (Skill Generator)
- Each skill appears as node in graph
- Edges show: "skill reads doc", "skill emits capability"
- Impact query: "If I remove this skill, what breaks?"

### With Item 7 (Memory Governance)
- Graph structure → Vault (stable)
- Graph queries → Live (computed on demand)
- Graph state (last updated) → Living docs

---

## SEMANTIC TAGS (Taxonomy)

Enrich nodes with tags for discovery:

```
Cost-related:
  - cost_optimization
  - token_burn
  - budget_tracking
  - margin_analysis

Performance:
  - latency
  - throughput
  - scalability
  - cache_strategy

Operational:
  - deployment
  - monitoring
  - alerting
  - incident_response

Architecture:
  - design_pattern
  - microservice
  - data_flow
  - integration_point

Compliance:
  - audit
  - governance
  - version_control
  - change_log
```

**Query example:**
```graphql
query NodesWithTag {
  nodesByTag(tag: "cost_optimization") {
    id
    title
    reason  # Why tagged
  }
}
```

---

## SUCCESS CRITERIA

✅ All doc/skill/concept nodes appear in graph  
✅ Impact queries return correct transitive dependencies  
✅ Concept discovery finds related docs (similarity >0.7)  
✅ Change timeline matches vault sync events  
✅ Critical path computed correctly  
✅ No cycles (except intentional loops)  
✅ Query response time <200ms  
✅ 90%+ semantic edge inference accuracy (spot-checked)  

---

## NEXT STEPS

1. **Confirm graph backend** — Neo4j or SQLite?
2. **Approve semantic tags** — Add more relevant tags?
3. **Implement extraction** — Run semantic enrichment
4. **Deploy query engine** — Make graph queryable
5. **Integrate visualizations** — Add to dashboard + docs

