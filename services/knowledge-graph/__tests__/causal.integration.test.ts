import request from "supertest"
import { Express } from "express"
import express from "express"
import { createCausalRouter } from "../src/causal/routes"

describe("Causal API Integration", () => {
  let app: Express
  let mockGraphStore: any

  beforeEach(() => {
    app = express()
    app.use(express.json())

    mockGraphStore = {
      getEvent: jest.fn(),
      getNodesAsOf: jest.fn().mockResolvedValue([
        { id: "agent-42", type: "agent" },
        { id: "skill-harvest", type: "skill" },
        { id: "rule-99", type: "governance_rule" }
      ]),
      getEdgesAsOf: jest.fn().mockResolvedValue([
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

  test("GET /causal/graph returns causal graph structure", async () => {
    const evt = {
      id: "evt-1",
      timestamp: 1730000000000,
      type: "memory.created",
      agent_id: "agent-42",
      skill_id: "skill-harvest",
      payload: { causes: [], caused_by: [] }
    }

    mockGraphStore.getEvent.mockResolvedValue(evt)

    const res = await request(app).get("/causal/graph?event_id=evt-1")

    expect(res.status).toBe(200)
    expect(res.body.causes).toBeDefined()
    expect(res.body.event).toBeDefined()
    expect(res.body.effects).toBeDefined()
  })

  test("GET /causal/interventions returns suggestions", async () => {
    const evt = {
      id: "evt-1",
      timestamp: 1730000000000,
      type: "agent.action",
      agent_id: "agent-42",
      payload: { threshold: 10 }
    }

    mockGraphStore.getEvent.mockResolvedValue(evt)

    const res = await request(app).get("/causal/interventions?event_id=evt-1")

    expect(res.status).toBe(200)
    expect(res.body.interventions).toBeDefined()
    expect(Array.isArray(res.body.interventions)).toBe(true)
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
