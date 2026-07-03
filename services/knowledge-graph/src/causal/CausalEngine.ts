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
