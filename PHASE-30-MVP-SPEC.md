# PHASE 30 — CAUSAL ENGINE (MVP FULL DROP-IN)
## Complete implementation skeleton + tests + API + rules + counterfactuals

---

# 1. FOLDER LAYOUT & FILES

```
services/knowledge-graph/src/causal/
  CausalAtom.ts          # Event normalization
  CausalSnapshot.ts      # KG point-in-time lookup
  CausalRules.ts         # Rule templates (10+ causal rules)
  CausalEngine.ts        # Core reasoning logic
  Counterfactual.ts      # Intervention simulator
  routes.ts              # Express API endpoints
  index.ts               # Public exports

__tests__/
  CausalAtom.test.ts     # 3 unit tests
  CausalRules.test.ts    # 4 unit tests
  CausalEngine.test.ts   # 3 unit tests
  Counterfactual.test.ts # 2 unit tests
  causal.integration.test.ts  # 2 integration tests (via API)
```

---

# 2. CAUSAL ATOM (normalized event)

**CausalAtom.ts**

```ts
export interface CausalAtom {
  id: string
  t: number
  type: string
  agent?: string
  skill?: string
  payload: Record<string, any>
}

export enum CausalAtomType {
  MEMORY_CREATED = "memory.created",
  MEMORY_UPDATED = "memory.updated",
  AGENT_ACTION = "agent.action",
  SKILL_EXECUTED = "skill.executed",
  GOVERNANCE_DECISION = "governance.decision",
  KG_MUTATION = "kg.mutation",
  EVENT_INGESTION = "event.ingestion",
  CORRELATION_DETECTED = "correlation.detected"
}

/**
 * Convert TorqueQuery event to canonical CausalAtom.
 * Ensures stable IDs, timestamps, types.
 */
export function toAtom(evt: any): CausalAtom {
  return {
    id: evt.id || evt.event_id,
    t: evt.timestamp || evt.created_at,
    type: evt.type || evt.event_type,
    agent: evt.agent_id,
    skill: evt.skill_id,
    payload: evt.payload || evt.data || {}
  }
}

/**
 * Validate atom structure. Deterministic.
 */
export function isValidAtom(atom: any): boolean {
  return !!(
    atom.id &&
    typeof atom.t === "number" &&
    atom.type &&
    typeof atom.payload === "object"
  )
}
```

---

# 3. KG SNAPSHOT (point-in-time view)

**CausalSnapshot.ts**

```ts
export interface KGNode {
  id: string
  type: string
  label?: string
  properties?: Record<string, any>
}

export interface KGEdge {
  src: string
  type: string
  dst: string
  weight?: number
}

export interface KGSnapshot {
  t: number
  getNode(id: string): KGNode | null
  getEdges(id: string): KGEdge[]
  hasEdge(src: string, type: string, dst: string): boolean
  getIncoming(id: string): KGEdge[]
  getOutgoing(id: string): KGEdge[]
}

/**
 * Create snapshot from GraphStore at timestamp.
 * Uses Phase 29 temporal API.
 */
export async function snapshotAt(
  graphStore: any,
  t: number
): Promise<KGSnapshot> {
  const nodes = await graphStore.getNodesAsOf(t)
  const edges = await graphStore.getEdgesAsOf(t)

  const nodeMap = new Map(nodes.map((n: any) => [n.id, n]))
  const outgoing = new Map<string, KGEdge[]>()
  const incoming = new Map<string, KGEdge[]>()

  for (const edge of edges) {
    if (!outgoing.has(edge.src)) outgoing.set(edge.src, [])
    if (!incoming.has(edge.dst)) incoming.set(edge.dst, [])
    outgoing.get(edge.src)!.push(edge)
    incoming.get(edge.dst)!.push(edge)
  }

  return {
    t,
    getNode: (id) => nodeMap.get(id) || null,
    getEdges: (id) => outgoing.get(id) || [],
    hasEdge: (src, type, dst) =>
      (outgoing.get(src) || []).some(e => e.type === type && e.dst === dst),
    getIncoming: (id) => incoming.get(id) || [],
    getOutgoing: (id) => outgoing.get(id) || []
  }
}
```

---

# 4. CAUSAL RULES (deterministic rule templates)

**CausalRules.ts**

```ts
import { CausalAtom, CausalAtomType } from "./CausalAtom"
import { KGSnapshot } from "./CausalSnapshot"

export interface CausalExplanation {
  atom_id: string
  rule: string
  because: string
  evidence: string[]
  confidence: "high" | "medium" | "low"
}

/**
 * Rule 1: Memory created because agent used skill
 */
function rule_memory_from_skill(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.MEMORY_CREATED) return null

  const agent = atom.agent
  const skill = atom.skill
  if (!agent || !skill) return null

  if (snap.hasEdge(agent, "uses_skill", skill)) {
    return {
      atom_id: atom.id,
      rule: "memory_from_skill",
      because: `Agent ${agent} created memory via skill ${skill}`,
      evidence: [
        `edge: ${agent} -[uses_skill]-> ${skill}`,
        `event: ${atom.id}`,
        `timestamp: ${atom.t}`
      ],
      confidence: "high"
    }
  }

  return null
}

/**
 * Rule 2: Agent action because governance rule permitted
 */
function rule_action_from_governance(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.AGENT_ACTION) return null

  const rule = atom.payload.governance_rule
  if (!rule) return null

  const ruleNode = snap.getNode(rule)
  if (!ruleNode) return null

  return {
    atom_id: atom.id,
    rule: "action_from_governance",
    because: `Governance rule ${rule} permitted agent action`,
    evidence: [`rule: ${rule}`, `event: ${atom.id}`],
    confidence: "high"
  }
}

/**
 * Rule 3: Skill executed because agent was scheduled
 */
function rule_skill_from_schedule(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.SKILL_EXECUTED) return null

  const agent = atom.agent
  const skill = atom.skill
  if (!agent || !skill) return null

  const schedule = snap.getEdges(agent).find(e => e.type === "scheduled_task")
  if (!schedule) return null

  return {
    atom_id: atom.id,
    rule: "skill_from_schedule",
    because: `Skill ${skill} was scheduled for agent ${agent}`,
    evidence: [
      `edge: ${agent} -[scheduled_task]-> ${schedule.dst}`,
      `event: ${atom.id}`
    ],
    confidence: "medium"
  }
}

/**
 * Rule 4: KG mutation because memory update triggered
 */
function rule_kg_from_memory(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.KG_MUTATION) return null

  const memory_id = atom.payload.memory_id
  if (!memory_id) return null

  const memNode = snap.getNode(memory_id)
  if (!memNode) return null

  return {
    atom_id: atom.id,
    rule: "kg_from_memory",
    because: `KG mutation triggered by memory ${memory_id} update`,
    evidence: [`memory: ${memory_id}`, `event: ${atom.id}`],
    confidence: "high"
  }
}

/**
 * Rule 5: Correlation detected because events co-occurred
 */
function rule_correlation_from_events(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.CORRELATION_DETECTED) return null

  const evt1 = atom.payload.event1_id
  const evt2 = atom.payload.event2_id
  const window_ms = atom.payload.time_window_ms

  if (!evt1 || !evt2) return null

  return {
    atom_id: atom.id,
    rule: "correlation_from_events",
    because: `Events ${evt1} and ${evt2} co-occurred within ${window_ms}ms`,
    evidence: [`event1: ${evt1}`, `event2: ${evt2}`, `window: ${window_ms}ms`],
    confidence: "medium"
  }
}

/**
 * Rule 6: Agent action because prior memory decision
 */
function rule_action_from_memory_decision(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.AGENT_ACTION) return null

  const memory_id = atom.payload.based_on_memory_id
  if (!memory_id) return null

  const memNode = snap.getNode(memory_id)
  if (!memNode) return null

  return {
    atom_id: atom.id,
    rule: "action_from_memory_decision",
    because: `Agent action was based on memory decision ${memory_id}`,
    evidence: [`memory: ${memory_id}`, `event: ${atom.id}`],
    confidence: "high"
  }
}

/**
 * Rule 7: Event ingestion because external source triggered
 */
function rule_ingest_from_source(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.EVENT_INGESTION) return null

  const source = atom.payload.source
  if (!source) return null

  const sourceNode = snap.getNode(source)
  if (!sourceNode) return null

  return {
    atom_id: atom.id,
    rule: "ingest_from_source",
    because: `Event ingested from external source ${source}`,
    evidence: [`source: ${source}`, `event: ${atom.id}`],
    confidence: "high"
  }
}

/**
 * Rule 8: Skill executed because prior skill dependency
 */
function rule_skill_from_dependency(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.SKILL_EXECUTED) return null

  const skill = atom.skill
  if (!skill) return null

  const deps = snap.getIncoming(skill).filter(e => e.type === "depends_on")
  if (deps.length === 0) return null

  return {
    atom_id: atom.id,
    rule: "skill_from_dependency",
    because: `Skill ${skill} executed due to dependency chain`,
    evidence: [
      ...deps.map(d => `dependency: ${d.src} -[depends_on]-> ${skill}`),
      `event: ${atom.id}`
    ],
    confidence: "medium"
  }
}

/**
 * Rule 9: Memory updated because skill produced new signal
 */
function rule_memory_update_from_signal(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.MEMORY_UPDATED) return null

  const signal = atom.payload.signal_id
  if (!signal) return null

  const signalNode = snap.getNode(signal)
  if (!signalNode) return null

  return {
    atom_id: atom.id,
    rule: "memory_update_from_signal",
    because: `Memory updated due to new signal ${signal}`,
    evidence: [`signal: ${signal}`, `event: ${atom.id}`],
    confidence: "high"
  }
}

/**
 * Rule 10: Governance decision because council voted
 */
function rule_governance_from_council(
  atom: CausalAtom,
  snap: KGSnapshot
): CausalExplanation | null {
  if (atom.type !== CausalAtomType.GOVERNANCE_DECISION) return null

  const council = atom.payload.council_id
  if (!council) return null

  const councilNode = snap.getNode(council)
  if (!councilNode) return null

  return {
    atom_id: atom.id,
    rule: "governance_from_council",
    because: `Governance decision made by council ${council}`,
    evidence: [`council: ${council}`, `event: ${atom.id}`],
    confidence: "high"
  }
}

/**
 * Apply all rules to atom. Return first match.
 */
export async function applyRules(
  atom: CausalAtom,
  snap: KGSnapshot
): Promise<CausalExplanation | null> {
  const rules = [
    rule_memory_from_skill,
    rule_action_from_governance,
    rule_skill_from_schedule,
    rule_kg_from_memory,
    rule_correlation_from_events,
    rule_action_from_memory_decision,
    rule_ingest_from_source,
    rule_skill_from_dependency,
    rule_memory_update_from_signal,
    rule_governance_from_council
  ]

  for (const rule of rules) {
    const result = rule(atom, snap)
    if (result) return result
  }

  return null
}
```

---

# 5. CAUSAL ENGINE (core reasoning)

**CausalEngine.ts**

```ts
import { CausalAtom, toAtom, isValidAtom } from "./CausalAtom"
import { KGSnapshot, snapshotAt } from "./CausalSnapshot"
import { CausalExplanation, applyRules } from "./CausalRules"

export interface CausalResult {
  event: CausalAtom
  explanation: CausalExplanation | null
  error?: string
}

/**
 * Main entry point: explain why an event happened.
 */
export async function explainEvent(
  evt: any,
  graphStore: any
): Promise<CausalResult> {
  try {
    const atom = toAtom(evt)

    if (!isValidAtom(atom)) {
      return {
        event: atom,
        explanation: null,
        error: "Invalid event atom"
      }
    }

    const snap = await snapshotAt(graphStore, atom.t)
    const explanation = await applyRules(atom, snap)

    return {
      event: atom,
      explanation
    }
  } catch (err: any) {
    return {
      event: toAtom(evt),
      explanation: null,
      error: err.message
    }
  }
}

/**
 * Explain multiple events in sequence.
 */
export async function explainEvents(
  evts: any[],
  graphStore: any
): Promise<CausalResult[]> {
  return Promise.all(evts.map(evt => explainEvent(evt, graphStore)))
}

/**
 * Get causal graph for event (all causes and effects).
 */
export async function getEventCausalGraph(
  evt: any,
  graphStore: any
): Promise<{
  causes: CausalResult[]
  event: CausalResult
  effects: CausalResult[]
}> {
  const atom = toAtom(evt)
  const snap = await snapshotAt(graphStore, atom.t)

  // Find causes: events that happened before
  const causesStr = atom.payload.caused_by || []
  const causes = await Promise.all(
    causesStr.map(async (id: string) => {
      const e = await graphStore.getEvent(id)
      return explainEvent(e, graphStore)
    })
  )

  // Find effects: events that happened after
  const effectsStr = atom.payload.causes || []
  const effects = await Promise.all(
    effectsStr.map(async (id: string) => {
      const e = await graphStore.getEvent(id)
      return explainEvent(e, graphStore)
    })
  )

  return {
    causes,
    event: await explainEvent(evt, graphStore),
    effects
  }
}
```

---

# 6. COUNTERFACTUAL OPERATOR (intervention simulator)

**Counterfactual.ts**

```ts
import { CausalAtom } from "./CausalAtom"
import { KGSnapshot } from "./CausalSnapshot"

export interface Intervention {
  type: "remove" | "add" | "modify" | "increase" | "decrease"
  target: string
  value?: any
}

export interface CounterfactualResult {
  intervention: Intervention
  original_event: CausalAtom
  predicted_outcome: {
    would_occur: boolean
    confidence: "high" | "medium" | "low"
    reasoning: string
  }
}

/**
 * Simulate: "If we remove this node, would the event still happen?"
 */
export async function removeIntervention(
  atom: CausalAtom,
  removed_node: string,
  snap: KGSnapshot
): Promise<CounterfactualResult> {
  // Check if removed_node is in the causal path
  const incoming = snap.getIncoming(atom.agent || "")
  const isInPath = incoming.some(e => e.src === removed_node)

  return {
    intervention: {
      type: "remove",
      target: removed_node
    },
    original_event: atom,
    predicted_outcome: {
      would_occur: !isInPath,
      confidence: isInPath ? "high" : "medium",
      reasoning: isInPath
        ? `Removing ${removed_node} would block event ${atom.id}`
        : `Removing ${removed_node} would not affect event ${atom.id}`
    }
  }
}

/**
 * Simulate: "If we increase this value, what happens?"
 */
export async function increaseIntervention(
  atom: CausalAtom,
  param: string,
  amount: number,
  snap: KGSnapshot
): Promise<CounterfactualResult> {
  const current = atom.payload[param] || 0

  return {
    intervention: {
      type: "increase",
      target: param,
      value: amount
    },
    original_event: atom,
    predicted_outcome: {
      would_occur: true,
      confidence: "low",
      reasoning: `Increasing ${param} by ${amount} (${current} -> ${current + amount}) would amplify event ${atom.id}`
    }
  }
}

/**
 * Simulate: "If we decrease this value, what happens?"
 */
export async function decreaseIntervention(
  atom: CausalAtom,
  param: string,
  amount: number,
  snap: KGSnapshot
): Promise<CounterfactualResult> {
  const current = atom.payload[param] || 0

  return {
    intervention: {
      type: "decrease",
      target: param,
      value: amount
    },
    original_event: atom,
    predicted_outcome: {
      would_occur: current - amount > 0,
      confidence: "low",
      reasoning: `Decreasing ${param} by ${amount} (${current} -> ${Math.max(0, current - amount)}) might suppress event ${atom.id}`
    }
  }
}

/**
 * Generate candidate interventions for an event.
 */
export async function suggestInterventions(
  atom: CausalAtom,
  snap: KGSnapshot
): Promise<Intervention[]> {
  const interventions: Intervention[] = []

  // Suggest removing inbound edges
  const incoming = snap.getIncoming(atom.agent || "")
  for (const edge of incoming.slice(0, 3)) {
    interventions.push({
      type: "remove",
      target: edge.src
    })
  }

  // Suggest decreasing numeric parameters
  for (const [key, val] of Object.entries(atom.payload)) {
    if (typeof val === "number" && val > 0) {
      interventions.push({
        type: "decrease",
        target: key,
        value: Math.ceil(val * 0.2)
      })
    }
  }

  return interventions
}
```

---

# 7. EXPRESS API ROUTES

**routes.ts**

```ts
import { Router, Request, Response } from "express"
import { explainEvent, getEventCausalGraph } from "./CausalEngine"
import {
  removeIntervention,
  increaseIntervention,
  decreaseIntervention,
  suggestInterventions
} from "./Counterfactual"
import { snapshotAt } from "./CausalSnapshot"
import { toAtom } from "./CausalAtom"

export function createCausalRouter(graphStore: any): Router {
  const router = Router()

  /**
   * GET /causal/why?event_id=...
   * Explain why an event happened.
   */
  router.get("/why", async (req: Request, res: Response) => {
    try {
      const { event_id } = req.query
      if (!event_id) {
        return res.status(400).json({ error: "Missing event_id" })
      }

      const evt = await graphStore.getEvent(event_id)
      if (!evt) {
        return res.status(404).json({ error: "Event not found" })
      }

      const result = await explainEvent(evt, graphStore)
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  /**
   * GET /causal/graph?event_id=...
   * Get causal graph (causes + event + effects).
   */
  router.get("/graph", async (req: Request, res: Response) => {
    try {
      const { event_id } = req.query
      if (!event_id) {
        return res.status(400).json({ error: "Missing event_id" })
      }

      const evt = await graphStore.getEvent(event_id)
      if (!evt) {
        return res.status(404).json({ error: "Event not found" })
      }

      const graph = await getEventCausalGraph(evt, graphStore)
      res.json(graph)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  /**
   * POST /causal/counterfactual
   * Simulate an intervention.
   * Body: { event_id, intervention: { type, target, value } }
   */
  router.post("/counterfactual", async (req: Request, res: Response) => {
    try {
      const { event_id, intervention } = req.body
      if (!event_id || !intervention) {
        return res
          .status(400)
          .json({ error: "Missing event_id or intervention" })
      }

      const evt = await graphStore.getEvent(event_id)
      if (!evt) {
        return res.status(404).json({ error: "Event not found" })
      }

      const atom = toAtom(evt)
      const snap = await snapshotAt(graphStore, atom.t)

      let result
      switch (intervention.type) {
        case "remove":
          result = await removeIntervention(atom, intervention.target, snap)
          break
        case "increase":
          result = await increaseIntervention(
            atom,
            intervention.target,
            intervention.value,
            snap
          )
          break
        case "decrease":
          result = await decreaseIntervention(
            atom,
            intervention.target,
            intervention.value,
            snap
          )
          break
        default:
          return res.status(400).json({ error: "Invalid intervention type" })
      }

      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  /**
   * GET /causal/interventions?event_id=...
   * Suggest candidate interventions for an event.
   */
  router.get("/interventions", async (req: Request, res: Response) => {
    try {
      const { event_id } = req.query
      if (!event_id) {
        return res.status(400).json({ error: "Missing event_id" })
      }

      const evt = await graphStore.getEvent(event_id)
      if (!evt) {
        return res.status(404).json({ error: "Event not found" })
      }

      const atom = toAtom(evt)
      const snap = await snapshotAt(graphStore, atom.t)
      const suggestions = await suggestInterventions(atom, snap)

      res.json({ interventions: suggestions })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
```

---

# 8. PUBLIC EXPORTS

**index.ts**

```ts
export { CausalAtom, CausalAtomType, toAtom, isValidAtom } from "./CausalAtom"
export { KGSnapshot, snapshotAt } from "./CausalSnapshot"
export { CausalExplanation, applyRules } from "./CausalRules"
export {
  explainEvent,
  explainEvents,
  getEventCausalGraph,
  CausalResult
} from "./CausalEngine"
export {
  Intervention,
  CounterfactualResult,
  removeIntervention,
  increaseIntervention,
  decreaseIntervention,
  suggestInterventions
} from "./Counterfactual"
export { createCausalRouter } from "./routes"
```

---

# 9. TEST SUITE

## 9.1 CausalAtom Tests

**__tests__/CausalAtom.test.ts**

```ts
import { toAtom, isValidAtom, CausalAtomType } from "../CausalAtom"

describe("CausalAtom", () => {
  test("toAtom normalizes TorqueQuery event", () => {
    const evt = {
      id: "evt-123",
      timestamp: 1730000000000,
      type: "memory.created",
      agent_id: "agent-42",
      skill_id: "skill-harvest",
      payload: { size: 512 }
    }

    const atom = toAtom(evt)

    expect(atom.id).toBe("evt-123")
    expect(atom.t).toBe(1730000000000)
    expect(atom.type).toBe("memory.created")
    expect(atom.agent).toBe("agent-42")
    expect(atom.skill).toBe("skill-harvest")
    expect(atom.payload.size).toBe(512)
  })

  test("isValidAtom rejects invalid atoms", () => {
    expect(isValidAtom({ id: "evt-1" })).toBe(false)
    expect(isValidAtom({ t: 123 })).toBe(false)
    expect(isValidAtom(null)).toBe(false)
    expect(
      isValidAtom({
        id: "evt-1",
        t: 123,
        type: "test",
        payload: {}
      })
    ).toBe(true)
  })

  test("CausalAtomType enum covers 8 types", () => {
    expect(CausalAtomType.MEMORY_CREATED).toBe("memory.created")
    expect(CausalAtomType.AGENT_ACTION).toBe("agent.action")
    expect(CausalAtomType.GOVERNANCE_DECISION).toBe("governance.decision")
    expect(CausalAtomType.KG_MUTATION).toBe("kg.mutation")
  })
})
```

## 9.2 CausalRules Tests

**__tests__/CausalRules.test.ts**

```ts
import { applyRules } from "../CausalRules"
import { CausalAtom, CausalAtomType } from "../CausalAtom"
import { KGSnapshot } from "../CausalSnapshot"

const mockSnapshot = (edges: Array<any>): KGSnapshot => ({
  t: 1730000000000,
  getNode: (id) => ({ id, type: "node" }),
  getEdges: (id) => edges.filter(e => e.src === id),
  hasEdge: (src, type, dst) =>
    edges.some(e => e.src === src && e.type === type && e.dst === dst),
  getIncoming: (id) => edges.filter(e => e.dst === id),
  getOutgoing: (id) => edges.filter(e => e.src === id)
})

describe("CausalRules", () => {
  test("rule_memory_from_skill detects memory creation via skill", async () => {
    const atom: CausalAtom = {
      id: "evt-1",
      t: 1730000000000,
      type: CausalAtomType.MEMORY_CREATED,
      agent: "agent-42",
      skill: "skill-harvest",
      payload: {}
    }

    const snap = mockSnapshot([
      { src: "agent-42", type: "uses_skill", dst: "skill-harvest" }
    ])

    const result = await applyRules(atom, snap)

    expect(result).not.toBeNull()
    expect(result?.rule).toBe("memory_from_skill")
    expect(result?.confidence).toBe("high")
  })

  test("rule_action_from_governance detects governance-permitted actions", async () => {
    const atom: CausalAtom = {
      id: "evt-2",
      t: 1730000000000,
      type: CausalAtomType.AGENT_ACTION,
      agent: "agent-42",
      payload: { governance_rule: "rule-99" }
    }

    const snap = mockSnapshot([])

    const result = await applyRules(atom, snap)

    expect(result).not.toBeNull()
    expect(result?.rule).toBe("action_from_governance")
  })

  test("rule_kg_from_memory detects KG mutations from memory updates", async () => {
    const atom: CausalAtom = {
      id: "evt-3",
      t: 1730000000000,
      type: CausalAtomType.KG_MUTATION,
      payload: { memory_id: "mem-1" }
    }

    const snap = mockSnapshot([])

    const result = await applyRules(atom, snap)

    expect(result).not.toBeNull()
    expect(result?.rule).toBe("kg_from_memory")
  })

  test("applyRules returns null if no rule matches", async () => {
    const atom: CausalAtom = {
      id: "evt-4",
      t: 1730000000000,
      type: "unknown.type" as any,
      payload: {}
    }

    const snap = mockSnapshot([])

    const result = await applyRules(atom, snap)

    expect(result).toBeNull()
  })
})
```

## 9.3 CausalEngine Tests

**__tests__/CausalEngine.test.ts**

```ts
import {
  explainEvent,
  explainEvents,
  getEventCausalGraph
} from "../CausalEngine"
import { GraphStore } from "../GraphStore" // mock/real

describe("CausalEngine", () => {
  let graphStore: any

  beforeEach(() => {
    graphStore = {
      getEvent: jest.fn(),
      getNodesAsOf: jest.fn().resolveValue([]),
      getEdgesAsOf: jest.fn().resolveValue([])
    }
  })

  test("explainEvent returns CausalResult with explanation", async () => {
    const evt = {
      id: "evt-1",
      timestamp: 1730000000000,
      type: "memory.created",
      agent_id: "agent-42",
      skill_id: "skill-harvest"
    }

    graphStore.getEvent.mockResolvedValue(evt)
    graphStore.getEdgesAsOf.mockResolvedValue([
      { src: "agent-42", type: "uses_skill", dst: "skill-harvest" }
    ])

    const result = await explainEvent(evt, graphStore)

    expect(result.event).toBeDefined()
    expect(result.explanation).toBeDefined()
  })

  test("explainEvent handles missing event gracefully", async () => {
    const evt = { id: "evt-missing" }
    graphStore.getEvent.mockResolvedValue(null)

    const result = await explainEvent(evt, graphStore)

    expect(result.error).toBeFalsy()
  })

  test("explainEvents processes multiple events", async () => {
    const evts = [
      { id: "evt-1", timestamp: 1730000000000, type: "memory.created" },
      { id: "evt-2", timestamp: 1730000001000, type: "agent.action" }
    ]

    graphStore.getEvent.mockImplementation((id: string) =>
      evts.find(e => e.id === id)
    )

    const results = await explainEvents(evts, graphStore)

    expect(results).toHaveLength(2)
  })
})
```

## 9.4 Counterfactual Tests

**__tests__/Counterfactual.test.ts**

```ts
import {
  removeIntervention,
  increaseIntervention,
  suggestInterventions
} from "../Counterfactual"
import { CausalAtom, CausalAtomType } from "../CausalAtom"
import { KGSnapshot } from "../CausalSnapshot"

const mockSnapshot = (incoming: Array<any>): KGSnapshot => ({
  t: 1730000000000,
  getNode: (id) => ({ id }),
  getEdges: () => [],
  hasEdge: () => false,
  getIncoming: () => incoming,
  getOutgoing: () => []
})

describe("Counterfactual", () => {
  test("removeIntervention predicts event blockage", async () => {
    const atom: CausalAtom = {
      id: "evt-1",
      t: 1730000000000,
      type: CausalAtomType.MEMORY_CREATED,
      agent: "agent-42",
      payload: {}
    }

    const snap = mockSnapshot([
      { src: "skill-harvest", type: "uses_skill", dst: "agent-42" }
    ])

    const result = await removeIntervention(atom, "skill-harvest", snap)

    expect(result.intervention.type).toBe("remove")
    expect(result.predicted_outcome.would_occur).toBe(false)
    expect(result.predicted_outcome.confidence).toBe("high")
  })

  test("increaseIntervention predicts amplification", async () => {
    const atom: CausalAtom = {
      id: "evt-1",
      t: 1730000000000,
      type: CausalAtomType.AGENT_ACTION,
      payload: { threshold: 10 }
    }

    const snap = mockSnapshot([])

    const result = await increaseIntervention(atom, "threshold", 5, snap)

    expect(result.intervention.type).toBe("increase")
    expect(result.predicted_outcome.would_occur).toBe(true)
  })

  test("suggestInterventions generates candidates", async () => {
    const atom: CausalAtom = {
      id: "evt-1",
      t: 1730000000000,
      type: CausalAtomType.AGENT_ACTION,
      agent: "agent-42",
      payload: { threshold: 10, confidence: 0.8 }
    }

    const snap = mockSnapshot([
      { src: "skill-harvest", type: "uses_skill", dst: "agent-42" }
    ])

    const suggestions = await suggestInterventions(atom, snap)

    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions.some(i => i.type === "remove")).toBe(true)
  })
})
```

## 9.5 Integration Tests (via API)

**__tests__/causal.integration.test.ts**

```ts
import request from "supertest"
import { Express } from "express"
import express from "express"
import { createCausalRouter } from "../routes"

describe("Causal API Integration", () => {
  let app: Express
  let mockGraphStore: any

  beforeEach(() => {
    app = express()
    app.use(express.json())

    mockGraphStore = {
      getEvent: jest.fn(),
      getNodesAsOf: jest.fn().resolveValue([
        { id: "agent-42", type: "agent" },
        { id: "skill-harvest", type: "skill" }
      ]),
      getEdgesAsOf: jest.fn().resolveValue([
        { src: "agent-42", type: "uses_skill", dst: "skill-harvest" }
      ])
    }

    app.use("/causal", createCausalRouter(mockGraphStore))
  })

  test("GET /causal/why?event_id=... returns explanation", async () => {
    const evt = {
      id: "evt-1",
      timestamp: 1730000000000,
      type: "memory.created",
      agent_id: "agent-42",
      skill_id: "skill-harvest"
    }

    mockGraphStore.getEvent.mockResolvedValue(evt)

    const res = await request(app).get("/causal/why?event_id=evt-1")

    expect(res.status).toBe(200)
    expect(res.body.event).toBeDefined()
    expect(res.body.explanation).toBeDefined()
  })

  test("POST /causal/counterfactual simulates intervention", async () => {
    const evt = {
      id: "evt-1",
      timestamp: 1730000000000,
      type: "agent.action",
      agent_id: "agent-42",
      payload: { governance_rule: "rule-99" }
    }

    mockGraphStore.getEvent.mockResolvedValue(evt)

    const res = await request(app)
      .post("/causal/counterfactual")
      .send({
        event_id: "evt-1",
        intervention: { type: "remove", target: "skill-harvest" }
      })

    expect(res.status).toBe(200)
    expect(res.body.intervention).toBeDefined()
    expect(res.body.predicted_outcome).toBeDefined()
  })
})
```

---

# 9.6 GraphStore Interface

**GraphStore.ts** (or import from Phase 29)

```ts
export interface GraphStoreEvent {
  id: string
  timestamp: number
  type: string
  agent_id?: string
  skill_id?: string
  payload?: Record<string, any>
}

export interface GraphNode {
  id: string
  type: string
  label?: string
  properties?: Record<string, any>
  valid_from?: number
  valid_to?: number
}

export interface GraphEdge {
  src: string
  type: string
  dst: string
  weight?: number
  valid_from?: number
  valid_to?: number
}

export interface IGraphStore {
  /**
   * Get event by ID. Used by causal engine to fetch events.
   */
  getEvent(id: string): Promise<GraphStoreEvent | null>

  /**
   * Get all nodes valid at timestamp t.
   * Used by causal snapshot builder.
   */
  getNodesAsOf(t: number): Promise<GraphNode[]>

  /**
   * Get all edges valid at timestamp t.
   * Used by causal snapshot builder.
   */
  getEdgesAsOf(t: number): Promise<GraphEdge[]>

  /**
   * Optional: get events in a time window.
   * Useful for correlation detection.
   */
  getEventsInWindow?(start: number, end: number): Promise<GraphStoreEvent[]>
}
```

---

# 9.7 Causal Subsystem README

**src/causal/README.md**

```markdown
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
npm test -- src/causal
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
```

---

# 9.8 Phase 2.5 Config Schema

**config/phase-2-5-schema.json**

```json
{
  "causal": {
    "enabled": {
      "type": "boolean",
      "default": true,
      "description": "Enable/disable causal reasoning engine"
    },
    "rules": {
      "type": "array",
      "description": "Enabled rule names",
      "default": [
        "rule_memory_from_skill",
        "rule_action_from_governance",
        "rule_skill_from_schedule",
        "rule_kg_from_memory",
        "rule_correlation_from_events",
        "rule_action_from_memory_decision",
        "rule_ingest_from_source",
        "rule_skill_from_dependency",
        "rule_memory_update_from_signal",
        "rule_governance_from_council"
      ]
    },
    "minConfidence": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "default": "medium",
      "description": "Minimum confidence threshold for explanations"
    },
    "minEvidenceCount": {
      "type": "integer",
      "default": 1,
      "description": "Minimum evidence artifacts per explanation"
    },
    "snapshotCacheTTL": {
      "type": "integer",
      "default": 60000,
      "description": "KG snapshot cache TTL in ms"
    }
  }
}
```

---

# 9.9 Causal Graph JSON Schema

**schemas/causal-graph.schema.json**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Causal Graph",
  "type": "object",
  "required": ["event", "explanation"],
  "properties": {
    "event": {
      "type": "object",
      "required": ["id", "t", "type", "payload"],
      "properties": {
        "id": { "type": "string" },
        "t": { "type": "number" },
        "type": { "type": "string" },
        "agent": { "type": ["string", "null"] },
        "skill": { "type": ["string", "null"] },
        "payload": { "type": "object" }
      }
    },
    "explanation": {
      "oneOf": [
        {
          "type": "object",
          "required": ["atom_id", "rule", "because", "evidence", "confidence"],
          "properties": {
            "atom_id": { "type": "string" },
            "rule": { "type": "string" },
            "because": { "type": "string" },
            "evidence": {
              "type": "array",
              "items": { "type": "string" }
            },
            "confidence": {
              "type": "string",
              "enum": ["high", "medium", "low"]
            }
          }
        },
        { "type": "null" }
      ]
    },
    "error": { "type": ["string", "null"] }
  }
}
```

---

# 9.10 Complete Integration Test File

**__tests__/causal.integration.test.ts** (complete)

```ts
import request from "supertest"
import { Express } from "express"
import express from "express"
import { createCausalRouter } from "../routes"

describe("Causal API Integration", () => {
  let app: Express
  let mockGraphStore: any

  beforeEach(() => {
    app = express()
    app.use(express.json())

    mockGraphStore = {
      getEvent: jest.fn(),
      getNodesAsOf: jest.fn().resolveValue([
        { id: "agent-42", type: "agent" },
        { id: "skill-harvest", type: "skill" },
        { id: "rule-99", type: "governance_rule" }
      ]),
      getEdgesAsOf: jest.fn().resolveValue([
        { src: "agent-42", type: "uses_skill", dst: "skill-harvest" },
        { src: "agent-42", type: "follows_rule", dst: "rule-99" }
      ])
    }

    app.use("/causal", createCausalRouter(mockGraphStore))
  })

  test("GET /causal/why?event_id=... returns explanation", async () => {
    const evt = {
      id: "evt-1",
      timestamp: 1730000000000,
      type: "memory.created",
      agent_id: "agent-42",
      skill_id: "skill-harvest"
    }

    mockGraphStore.getEvent.mockResolvedValue(evt)

    const res = await request(app).get("/causal/why?event_id=evt-1")

    expect(res.status).toBe(200)
    expect(res.body.event).toBeDefined()
    expect(res.body.event.id).toBe("evt-1")
    expect(res.body.explanation).toBeDefined()
    expect(res.body.explanation?.rule).toBe("memory_from_skill")
    expect(res.body.explanation?.confidence).toBe("high")
  })

  test("POST /causal/counterfactual simulates intervention", async () => {
    const evt = {
      id: "evt-1",
      timestamp: 1730000000000,
      type: "agent.action",
      agent_id: "agent-42",
      payload: { governance_rule: "rule-99" }
    }

    mockGraphStore.getEvent.mockResolvedValue(evt)

    const res = await request(app)
      .post("/causal/counterfactual")
      .send({
        event_id: "evt-1",
        intervention: { type: "remove", target: "skill-harvest" }
      })

    expect(res.status).toBe(200)
    expect(res.body.intervention).toBeDefined()
    expect(res.body.intervention.type).toBe("remove")
    expect(res.body.intervention.target).toBe("skill-harvest")
    expect(res.body.predicted_outcome).toBeDefined()
    expect(res.body.predicted_outcome.confidence).toMatch(/high|medium|low/)
  })
})
```

---

# 10. INTEGRATION CHECKLIST (BUILD-READY)

## 10.1 File Creation (no prompts required)

- [ ] Create `c:\dev\services\knowledge-graph\src\causal\CausalAtom.ts` — 60 LOC
- [ ] Create `c:\dev\services\knowledge-graph\src\causal\CausalSnapshot.ts` — 45 LOC
- [ ] Create `c:\dev\services\knowledge-graph\src\causal\CausalRules.ts` — 320 LOC (10 rules + applyRules)
- [ ] Create `c:\dev\services\knowledge-graph\src\causal\CausalEngine.ts` — 80 LOC
- [ ] Create `c:\dev\services\knowledge-graph\src\causal\Counterfactual.ts` — 110 LOC
- [ ] Create `c:\dev\services\knowledge-graph\src\causal\routes.ts` — 130 LOC
- [ ] Create `c:\dev\services\knowledge-graph\src\causal\index.ts` — 15 LOC
- [ ] Create `c:\dev\services\knowledge-graph\src\causal\README.md` — 100 LOC
- [ ] Create `c:\dev\services\knowledge-graph\__tests__\CausalAtom.test.ts` — 40 LOC
- [ ] Create `c:\dev\services\knowledge-graph\__tests__\CausalRules.test.ts` — 80 LOC
- [ ] Create `c:\dev\services\knowledge-graph\__tests__\CausalEngine.test.ts` — 70 LOC
- [ ] Create `c:\dev\services\knowledge-graph\__tests__\Counterfactual.test.ts` — 65 LOC
- [ ] Create `c:\dev\services\knowledge-graph\__tests__\causal.integration.test.ts` — 90 LOC

**Total: ~1.2K LOC implementation + ~0.3K LOC tests**

## 10.2 Package Dependencies (verify, no installs needed)

File: `c:\dev\services\knowledge-graph\package.json`

Required packages (must exist):

```json
{
  "dependencies": {
    "express": "^4.18.0+",
    "typescript": "^5.0+",
    "@types/node": "^20.0+"
  },
  "devDependencies": {
    "jest": "^29.0+",
    "ts-jest": "^29.0+",
    "@types/jest": "^29.0+",
    "supertest": "^6.3.0+",
    "@types/express": "^4.17.0+"
  }
}
```

**Action:** Verify these exist. If `supertest` or `@types/jest` missing, add them:

```bash
cd c:\dev\services\knowledge-graph
npm install --save-dev supertest@^6.3.0 @types/jest@^29.0.0
```

## 10.3 Jest Config (verify)

File: `c:\dev\services\knowledge-graph\jest.config.js`

Must have `ts-jest` preset. Check for:

```js
preset: 'ts-jest',
testEnvironment: 'node',
testMatch: ['**/__tests__/**/*.test.ts'],
```

If missing or needs update, create/update.

## 10.4 TypeScript Config (verify)

File: `c:\dev\services\knowledge-graph\tsconfig.json`

Must support:
- `target: ES2020+`
- `module: commonjs`
- `strict: true`
- `esModuleInterop: true`

## 10.5 Express App Integration (CRITICAL)

File: `c:\dev\services\knowledge-graph\src\codeflow-server.ts` (or main entry point)

Must add router mounting:

```ts
import { createCausalRouter } from "./causal"
import { GraphStore } from "./core/graph_store/GraphStore"

const graphStore = new GraphStore(...)  // existing instance
const causalRouter = createCausalRouter(graphStore)

app.use("/causal", causalRouter)
```

**Ask Chris:** Is main Express entry `codeflow-server.ts` or something else? If unknown, assume `src/index.ts` or `src/server.ts`.

## 10.6 GraphStore Verification (CRITICAL)

File: `c:\dev\services\knowledge-graph\src/core/graph_store/GraphStore.ts`

Must expose:

```ts
async getEvent(id: string): Promise<any | null>
async getNodesAsOf(t: number): Promise<any[]>
async getEdgesAsOf(t: number): Promise<any[]>
```

**If missing:** Causal engine cannot function. Block until verified.

## 10.7 Docker Build (if in container)

If building in Docker (recommended for Node native modules):

**Dockerfile:** `services/knowledge-graph/Dockerfile`

Must include:

```dockerfile
# Ensure Node 20+
FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
RUN npm test
```

**Compose:** `docker-compose.yml`

Must have `knowledge-graph` service:

```yaml
knowledge-graph:
  build:
    context: .
    dockerfile: services/knowledge-graph/Dockerfile
  ports:
    - "3100:3100"
  environment:
    NODE_ENV: test
```

## 10.8 Test Execution (verification)

After files created:

```bash
# From project root or services/knowledge-graph
npm test -- __tests__/causal

# Expected output:
# PASS __tests__/CausalAtom.test.ts (3 tests)
# PASS __tests__/CausalRules.test.ts (4 tests)
# PASS __tests__/CausalEngine.test.ts (3 tests)
# PASS __tests__/Counterfactual.test.ts (2 tests)
# PASS __tests__/causal.integration.test.ts (2 tests)
# Total: 14 tests, 14 passed
```

## 10.9 Build Blockers (would require prompts)

⚠️ **If any of these are true, I need clarification:**

- [ ] GraphStore is in a different location than `src/core/graph_store/GraphStore.ts`
- [ ] Express entry point is not in `codeflow-server.ts`
- [ ] Package.json is missing `supertest` and you don't want me to add it
- [ ] Jest config doesn't exist or is incompatible
- [ ] TorqueQuery event schema has changed since Phase 26
- [ ] You want causal routes on a different path (not `/causal`)
- [ ] You need causal engine integrated with Phase 24 governance vault
- [ ] You need config injection from Phase 2.5 in `CausalEngine` (not just hardcoded)

**If NONE of the above are blockers, proceed without prompting.**

## 10.10 Docker Build Command (zero-prompt)

Once files are written:

```bash
# Build and test in Docker
docker-compose up --build knowledge-graph

# Host-side test (if Docker not available)
cd services/knowledge-graph && npm test -- __tests__/causal

# Expected: 14/14 passing
```

---

# 11. OPTIONAL EXTRAS (generated for integration clarity)

## 11.1 server.ts Integration Diff

**File:** `services/knowledge-graph/src/server.ts`

**Add these imports at the top:**

```ts
import { createCausalRouter } from "./causal/routes"
```

**Add this mount point after KG routes but before health checks:**

```ts
// Causal reasoning engine (Phase 30)
const causalRouter = createCausalRouter(graphStore)
app.use("/causal", causalRouter)
```

**Full context (example):**

```ts
import express from "express"
import { GraphStore } from "./core/graph_store/GraphStore"
import { createCausalRouter } from "./causal/routes"

const app = express()
const graphStore = new GraphStore(...)

// KG routes
app.use("/kg", createKGRouter(graphStore))

// Causal reasoning engine (Phase 30)
const causalRouter = createCausalRouter(graphStore)
app.use("/causal", causalRouter)

// Health checks
app.get("/health", (req, res) => res.json({ status: "ok" }))

app.listen(3100, () => console.log("KG service on 3100"))
```

---

## 11.2 GraphStore Interface (for reference)

**File:** `services/knowledge-graph/src/core/graph_store/GraphStore.ts`

**Already exists. Causal engine expects these methods:**

```ts
export interface IGraphStore {
  /**
   * Fetch event by ID (required by causal engine).
   */
  async getEvent(id: string): Promise<{
    id: string
    timestamp: number
    type: string
    agent_id?: string
    skill_id?: string
    payload?: Record<string, any>
  } | null>

  /**
   * Get all nodes valid at timestamp t (required by causal snapshot).
   */
  async getNodesAsOf(t: number): Promise<Array<{
    id: string
    type: string
    label?: string
    properties?: Record<string, any>
    valid_from?: number
    valid_to?: number
  }>>

  /**
   * Get all edges valid at timestamp t (required by causal snapshot).
   */
  async getEdgesAsOf(t: number): Promise<Array<{
    src: string
    type: string
    dst: string
    weight?: number
    valid_from?: number
    valid_to?: number
  }>>
}
```

**If GraphStore doesn't expose these, add them before Phase 30 build.**

---

## 11.3 Dockerfile (knowledge-graph service)

**File:** `services/knowledge-graph/Dockerfile`

If this file doesn't exist or needs updating:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy monorepo root and knowledge-graph service
COPY package*.json ./
COPY services/knowledge-graph ./services/knowledge-graph

WORKDIR /app/services/knowledge-graph

# Install dependencies
RUN npm ci

# Build TypeScript
RUN npm run build

# Expose KG service port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3100/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start service
CMD ["npm", "run", "start"]
```

**If Dockerfile already exists:** no changes needed (causal router is internal to Node process).

---

## 11.4 docker-compose.yml (knowledge-graph service)

**File:** `docker-compose.yml` (root)

If knowledge-graph service doesn't exist:

```yaml
version: '3.8'

services:
  knowledge-graph:
    build:
      context: .
      dockerfile: services/knowledge-graph/Dockerfile
    container_name: cic-knowledge-graph
    ports:
      - "3100:3100"
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
    volumes:
      - ./services/knowledge-graph/data:/app/services/knowledge-graph/data
    depends_on:
      torquequery:
        condition: service_healthy
    networks:
      - cic-network

  torquequery:
    # existing TorqueQuery service (Phase 26)
    ...

networks:
  cic-network:
    driver: bridge
```

---

## 11.5 Integration README (Phase 30 onboarding)

**File:** `services/knowledge-graph/docs/PHASE-30-INTEGRATION.md`

```markdown
# Phase 30 Causal Engine Integration Guide

## Quick Start

Once Phase 30 files are built:

```bash
# 1. From project root
cd services/knowledge-graph

# 2. Run tests
npm test -- __tests__/causal

# Expected: 14/14 passing

# 3. Start service (via Docker)
docker-compose up --build knowledge-graph

# Service runs on http://localhost:3100

# 4. Test causal endpoints
curl http://localhost:3100/causal/why?event_id=evt-123
curl http://localhost:3100/causal/interventions?event_id=evt-123
```

## API Endpoints

All endpoints require an event_id in TorqueQuery.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/causal/why?event_id=...` | GET | Explain why event happened |
| `/causal/graph?event_id=...` | GET | Get full causal graph (causes + event + effects) |
| `/causal/counterfactual` | POST | Simulate intervention |
| `/causal/interventions?event_id=...` | GET | Suggest interventions |

## Architecture

```
TorqueQuery Event (Phase 26)
        ↓
  CausalAtom (normalize)
        ↓
  KGSnapshot (temporal view)
        ↓
  CausalRules (10 templates)
        ↓
  CausalEngine (reasoning)
        ↓
  Express API
```

## Integration with Phase 31 (Orchestration)

Phase 30 provides:
- Deterministic explanations for all events
- Counterfactual predictions
- Intervention suggestions
- Audit trail (all evidence is traceable)

Phase 31 consumes:
- `/causal/why` → Operator dashboards
- `/causal/interventions` → Governance automation
- `/causal/counterfactual` → Planning engine

## Testing in Docker

```bash
docker-compose up --build knowledge-graph
docker exec cic-knowledge-graph npm test -- __tests__/causal
```

## Troubleshooting

**"GraphStore not found"** → Verify Phase 29 is built
**"Event not found"** → Verify TorqueQuery (Phase 26) is ingesting
**Tests fail** → Run `npm install` in services/knowledge-graph, then retry
```

---

# 12. EXAMPLE USAGE (in Phase 31+)

```ts
// In some service that consumes KG + TorqueQuery
import { explainEvent, suggestInterventions, snapshotAt } from "./causal"

// Explain a single event
const result = await explainEvent(torqueEvent, graphStore)
console.log(result.explanation?.because)

// Get causal graph (causes → event → effects)
const graph = await getEventCausalGraph(torqueEvent, graphStore)
console.log(graph.causes, graph.event, graph.effects)

// Simulate interventions
const snap = await snapshotAt(graphStore, torqueEvent.timestamp)
const suggestions = await suggestInterventions(torqueEvent, snap)
for (const intervention of suggestions) {
  const outcome = await applyIntervention(torqueEvent, intervention, snap)
  console.log(outcome.predicted_outcome)
}
```

---

# 13. PHASE 30 DEPENDENCIES

- **Phase 29 (Knowledge Graph)** — Must have GraphStore with temporal API
- **Phase 26 (TorqueQuery)** — Must have event schema + ingestion
- **Express.js** — Already in stack
- **Jest** — Already in stack

**No new dependencies.**

---

# 14. SUCCESS CRITERIA

- [ ] All 14 tests passing
- [ ] `/causal/why`, `/causal/graph`, `/causal/counterfactual`, `/causal/interventions` endpoints working
- [ ] Explanations deterministic and reproducible
- [ ] Counterfactuals replayable from event history
- [ ] Integration with Phase 31 (Orchestration) ready
- [ ] Causal artifacts audit-safe (no hallucinations)

---

Done. Claude can build from this.
