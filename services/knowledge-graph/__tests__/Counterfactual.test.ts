import {
  removeIntervention,
  increaseIntervention,
  suggestInterventions
} from "../src/causal/Counterfactual"
import { CausalAtom, CausalAtomType } from "../src/causal/CausalAtom"
import { KGSnapshot } from "../src/causal/CausalSnapshot"

const mockSnapshot = (incoming: Array<any>): KGSnapshot => ({
  t: 1730000000000,
  getNode: (id) => ({ id, type: "generic", externalId: id, createdByEventId: "", validFrom: 0, payloadJson: {}, version: 1 }),
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
