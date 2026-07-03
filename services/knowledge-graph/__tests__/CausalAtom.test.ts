import { toAtom, isValidAtom, CausalAtomType } from "../src/causal/CausalAtom"

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
