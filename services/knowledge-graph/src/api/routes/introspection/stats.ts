import { Request, Response } from "express";
import { GraphStore } from "../../../core/graph_store/GraphStore";

export function statsRoute(store: GraphStore) {
  return async (req: Request, res: Response): Promise<void> => {
    const stats = await store.getStats();
    res.json({
      nodes: {
        total: stats.nodeCount,
        byType: {},
      },
      edges: {
        total: stats.edgeCount,
        byType: {},
      },
      density: 0,
      lastIngestionAt: stats.lastIngestionAt,
    });
  };
}
