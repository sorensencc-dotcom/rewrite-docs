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
    atom &&
    atom.id &&
    typeof atom.t === "number" &&
    atom.type &&
    typeof atom.payload === "object"
  )
}
