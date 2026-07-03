import { Express, Request, Response } from "express";
import { EventRouter } from "./EventRouter";
import { IdempotencyManager } from "./IdempotencyManager";
import { GraphStore } from "../core/graph_store/GraphStore";

export interface TorqueEvent {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  actor: string;
  payload: Record<string, unknown>;
  meta: {
    trace_id: string;
    span_id: string;
    schema_version: number;
  };
}

export class EventIntakeServer {
  private router: EventRouter;
  private idempotency: IdempotencyManager;

  constructor(store: GraphStore) {
    this.router = new EventRouter(store);
    this.idempotency = new IdempotencyManager(store);
  }

  registerRoutes(app: Express): void {
    app.post(
      "/api/knowledge-graph/ingest/torque",
      this.handleIngest.bind(this)
    );

    app.post(
      "/api/knowledge-graph/ingest/torque/batch",
      this.handleBatchIngest.bind(this)
    );
  }

  private async handleIngest(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const event = req.body as TorqueEvent;

      // Validate schema
      this.validateEventSchema(event);

      // Check idempotency
      const isDuplicate = await this.idempotency.isDuplicate(
        event.id,
        "torque"
      );

      if (isDuplicate) {
        res.json({
          status: "already_ingested",
          event_id: event.id,
          message: "Event already processed",
        });
        return;
      }

      // Route and ingest
      await this.router.routeEvent(event);

      // Update cursor
      await this.idempotency.updateCursor(
        "torque",
        event.id,
        event.timestamp
      );

      res.json({
        status: "ingested",
        event_id: event.id,
        message: "Event successfully ingested",
      });
    } catch (err: any) {
      console.error("Ingest error:", err);
      res.status(400).json({
        status: "error",
        error: err.message,
      });
    }
  }

  private async handleBatchIngest(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { events } = req.body as { events: TorqueEvent[] };

      if (!Array.isArray(events)) {
        res.status(400).json({
          status: "error",
          error: "events must be an array",
        });
        return;
      }

      const results = [];

      for (const event of events) {
        try {
          this.validateEventSchema(event);

          const isDuplicate = await this.idempotency.isDuplicate(
            event.id,
            "torque"
          );

          if (isDuplicate) {
            results.push({
              event_id: event.id,
              status: "skipped",
              reason: "already_ingested",
            });
            continue;
          }

          await this.router.routeEvent(event);
          await this.idempotency.updateCursor(
            "torque",
            event.id,
            event.timestamp
          );

          results.push({
            event_id: event.id,
            status: "ingested",
          });
        } catch (err: any) {
          results.push({
            event_id: event.id,
            status: "error",
            error: err.message,
          });
        }
      }

      res.json({
        status: "batch_complete",
        total: events.length,
        results,
      });
    } catch (err: any) {
      console.error("Batch ingest error:", err);
      res.status(400).json({
        status: "error",
        error: err.message,
      });
    }
  }

  private validateEventSchema(event: TorqueEvent): void {
    if (!event.id) throw new Error("Missing event.id");
    if (!event.type) throw new Error("Missing event.type");
    if (!event.timestamp) throw new Error("Missing event.timestamp");
    if (!event.source) throw new Error("Missing event.source");
    if (!event.actor) throw new Error("Missing event.actor");
    if (!event.payload) throw new Error("Missing event.payload");
    if (!event.meta) throw new Error("Missing event.meta");
    if (!event.meta.schema_version) throw new Error("Missing event.meta.schema_version");

    // Schema version check
    if (event.meta.schema_version !== 1) {
      throw new Error(
        `Unsupported schema version: ${event.meta.schema_version}`
      );
    }
  }
}
