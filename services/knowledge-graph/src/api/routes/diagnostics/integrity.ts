import { Request, Response } from "express";
import { GraphStore } from "../../../core/graph_store/GraphStore";

export function integrityCheckRoute(store: GraphStore) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await store.getStats();

      const checks = {
        digestTableExists: stats.digestCount > 0,
        nodeTableExists: stats.nodeCount >= 0,
        edgeTableExists: stats.edgeCount >= 0,
        recentActivity:
          stats.lastIngestionAt && Date.now() - stats.lastIngestionAt < 60000,
      };

      const allPassed = Object.values(checks).every((c) => c);

      res.json({
        status: allPassed ? "healthy" : "degraded",
        timestamp: Date.now(),
        checks,
        stats: {
          totalNodes: stats.nodeCount,
          totalEdges: stats.edgeCount,
          totalDigests: stats.digestCount,
          lastIngestionAt: stats.lastIngestionAt,
          timeSinceLastIngestion: stats.lastIngestionAt
            ? Date.now() - stats.lastIngestionAt
            : null,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        error: err.message,
        timestamp: Date.now(),
      });
    }
  };
}
