import { Request, Response } from "express";
import { GraphStore } from "../core/graph_store/GraphStore";

export interface MetricsSnapshot {
  timestamp: number;
  nodeCount: number;
  edgeCount: number;
  digestCount: number;
  ingestRate: number; // events/sec
  uptime: number; // ms
}

export class MetricsCollector {
  private startTime: number = Date.now();
  private lastSnapshot: MetricsSnapshot | null = null;
  private snapshots: MetricsSnapshot[] = [];
  private maxSnapshots: number = 1000;

  async collect(store: GraphStore): Promise<MetricsSnapshot> {
    const stats = await store.getStats();
    const now = Date.now();
    const uptime = now - this.startTime;

    // Calculate ingestion rate
    const ingestRate = stats.digestCount > 0 ? stats.digestCount / (uptime / 1000) : 0;

    const snapshot: MetricsSnapshot = {
      timestamp: now,
      nodeCount: stats.nodeCount,
      edgeCount: stats.edgeCount,
      digestCount: stats.digestCount,
      ingestRate: Number(ingestRate.toFixed(2)),
      uptime,
    };

    this.lastSnapshot = snapshot;

    // Keep circular buffer of snapshots
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getLastSnapshot(): MetricsSnapshot | null {
    return this.lastSnapshot;
  }

  getSnapshots(): MetricsSnapshot[] {
    return [...this.snapshots];
  }

  exportPrometheus(snapshot: MetricsSnapshot): string {
    const lines = [
      "# HELP kg_nodes_total Total number of nodes in knowledge graph",
      "# TYPE kg_nodes_total gauge",
      `kg_nodes_total ${snapshot.nodeCount}`,
      "",
      "# HELP kg_edges_total Total number of edges in knowledge graph",
      "# TYPE kg_edges_total gauge",
      `kg_edges_total ${snapshot.edgeCount}`,
      "",
      "# HELP kg_digests_total Total number of digest entries",
      "# TYPE kg_digests_total gauge",
      `kg_digests_total ${snapshot.digestCount}`,
      "",
      "# HELP kg_ingest_rate_events_per_second Current ingestion rate",
      "# TYPE kg_ingest_rate_events_per_second gauge",
      `kg_ingest_rate_events_per_second ${snapshot.ingestRate}`,
      "",
      "# HELP kg_uptime_ms Service uptime in milliseconds",
      "# TYPE kg_uptime_ms gauge",
      `kg_uptime_ms ${snapshot.uptime}`,
      "",
    ];

    return lines.join("\n");
  }
}

export const metricsCollector = new MetricsCollector();

export function metricsRoute(store: GraphStore) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const snapshot = await metricsCollector.collect(store);
      const prometheus = metricsCollector.exportPrometheus(snapshot);

      res.set("Content-Type", "text/plain");
      res.send(prometheus);
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        error: err.message,
      });
    }
  };
}
