import {
  explainEvent,
  explainEvents,
  getEventCausalGraph
} from "../src/causal/CausalEngine"

describe("CausalEngine", () => {
  let graphStore: any

  beforeEach(() => {
    graphStore = {
      getEvent: jest.fn(),
      getNodesAsOf: jest.fn().mockResolvedValue([]),
      getEdgesAsOf: jest.fn().mockResolvedValue([])
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

  test("explainEvent handles invalid event gracefully", async () => {
    const evt = { id: "evt-incomplete" }

    const result = await explainEvent(evt, graphStore)

    expect(result.explanation).toBeNull()
    expect(result.error).toBeDefined()
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
