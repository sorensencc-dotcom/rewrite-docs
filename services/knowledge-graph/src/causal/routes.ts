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
      if (!event_id || typeof event_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid event_id" })
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
      if (!event_id || typeof event_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid event_id" })
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
      if (!event_id || typeof event_id !== "string" || !intervention) {
        return res
          .status(400)
          .json({ error: "Missing or invalid event_id or intervention" })
      }

      if (
        !["remove", "add", "modify", "increase", "decrease"].includes(
          intervention.type
        )
      ) {
        return res.status(400).json({ error: "Invalid intervention type" })
      }

      if (typeof intervention.target !== "string") {
        return res.status(400).json({ error: "Invalid intervention target" })
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
      if (!event_id || typeof event_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid event_id" })
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
