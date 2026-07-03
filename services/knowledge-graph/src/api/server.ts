import express, { Express, Request, Response, NextFunction } from "express";
import { GraphStore } from "../core/graph_store/GraphStore";
import { schemaRoute } from "./routes/introspection/schema";
import { statsRoute } from "./routes/introspection/stats";
import { integrityCheckRoute } from "./routes/diagnostics/integrity";
import { cursorStatusRoute } from "./routes/diagnostics/cursor";
import { eventLagRoute } from "./routes/diagnostics/lag";
import { metricsRoute } from "../infra/metrics";
import { EventIntakeServer } from "../ingestion/EventIntakeServer";
import { IdempotencyManager } from "../ingestion/IdempotencyManager";

export function createServer(store: GraphStore): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/api/knowledge-graph/schema", schemaRoute);
  app.get("/api/knowledge-graph/stats", statsRoute(store));

  // Event intake routes
  const intakeServer = new EventIntakeServer(store);
  intakeServer.registerRoutes(app);

  // Diagnostic routes
  const idempotency = new IdempotencyManager(store);
  app.get("/api/knowledge-graph/diagnostics/integrity", integrityCheckRoute(store));
  app.get("/api/knowledge-graph/diagnostics/cursor", cursorStatusRoute(idempotency));
  app.get("/api/knowledge-graph/diagnostics/lag", eventLagRoute(idempotency));

  // Metrics endpoint (Prometheus-compatible)
  app.get("/metrics", metricsRoute(store));

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });

  return app;
}

export async function startServer(store: GraphStore, port: number = 3100): Promise<void> {
  const app = createServer(store);
  app.listen(port, () => {
    console.log(`Knowledge Graph service listening on port ${port}`);
  });
}
