import { applyRules } from "../src/causal/CausalRules"
import { CausalAtom, CausalAtomType } from "../src/causal/CausalAtom"
import { KGSnapshot } from "../src/causal/CausalSnapshot"

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
