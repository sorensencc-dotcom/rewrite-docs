# Causal Reasoning Engine (Phase 30)

Deterministic, explainable causal inference layer over TorqueQuery events and Knowledge Graph state.

## Architecture

- **CausalAtom** — Normalized event representation
- **CausalSnapshot** — Point-in-time KG slice
- **CausalRules** — 10 deterministic rule templates
- **CausalEngine** — Core reasoning logic
- **Counterfactual** — Intervention simulator
- **routes** — Express API

## API

### GET /causal/why?event_id=...
Explain why an event happened.

**Response:**
```json
{
  "event": { "id": "...", "t": 1730000000, "type": "memory.created", "agent": "agent-42", "skill": "skill-harvest", "payload": {} },
  "explanation": {
    "atom_id": "evt-1",
    "rule": "memory_from_skill",
    "because": "Agent agent-42 created memory via skill skill-harvest",
    "evidence": ["edge: agent-42 -[uses_skill]-> skill-harvest", "event: evt-1", "timestamp: 1730000000"],
    "confidence": "high"
  }
}
```

### GET /causal/graph?event_id=...
Get causal graph (causes + event + effects).

**Response:**
```json
{
  "causes": [{ "event": {...}, "explanation": {...} }],
  "event": { "event": {...}, "explanation": {...} },
  "effects": [{ "event": {...}, "explanation": {...} }]
}
```

### POST /causal/counterfactual
Simulate an intervention.

**Request:**
```json
{
  "event_id": "evt-1",
  "intervention": {
    "type": "remove",
    "target": "skill-harvest",
    "value": null
  }
}
```

**Response:**
```json
{
  "intervention": { "type": "remove", "target": "skill-harvest" },
  "original_event": { "id": "evt-1", "t": 1730000000, ... },
  "predicted_outcome": {
    "would_occur": false,
    "confidence": "high",
    "reasoning": "Removing skill-harvest would block event evt-1"
  }
}
```

### GET /causal/interventions?event_id=...
Suggest candidate interventions.

**Response:**
```json
{
  "interventions": [
    { "type": "remove", "target": "skill-harvest" },
    { "type": "decrease", "target": "threshold", "value": 2 }
  ]
}
```

## Rules (10 templates)

1. `rule_memory_from_skill` — Memory created via agent skill use
2. `rule_action_from_governance` — Agent action permitted by governance rule
3. `rule_skill_from_schedule` — Skill executed due to schedule
4. `rule_kg_from_memory` — KG mutated by memory update
5. `rule_correlation_from_events` — Correlation detected from co-occurrence
6. `rule_action_from_memory_decision` — Agent action based on memory decision
7. `rule_ingest_from_source` — Event ingested from external source
8. `rule_skill_from_dependency` — Skill executed due to dependency
9. `rule_memory_update_from_signal` — Memory updated by signal
10. `rule_governance_from_council` — Governance decision from council vote

## Testing

```bash
npm test -- __tests__/causal
```

All 14 tests must pass (12 unit + 2 integration).

## Integration (Phase 31+)

```ts
import { createCausalRouter } from "./causal"

const causalRouter = createCausalRouter(graphStore)
app.use("/causal", causalRouter)
```

## Determinism Guarantee

- All explanations derived from KG snapshot at event timestamp
- All rules are pattern-matching (no LLM, no randomness)
- All counterfactuals replayable from event history
- All evidence is audit-traceable
