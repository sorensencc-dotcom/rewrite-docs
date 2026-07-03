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
