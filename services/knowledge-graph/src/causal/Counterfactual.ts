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
