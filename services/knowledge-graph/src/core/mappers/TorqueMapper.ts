import { randomUUID } from "crypto";
import { Node } from "../models/Node";
import { Edge } from "../models/Edge";

export type TorqueEvent = {
  id: string;
  agent_id: string;
  timestamp: string;
  type: string;
  repo_id?: string;
  file_ids?: string[];
  metadata: Record<string, unknown>;
};

export type TorqueSignal = {
  id: string;
  kind: string;
  severity: string;
  timestamp: string;
  agent_id?: string;
  repo_id?: string;
  event_id?: string;
  metadata: Record<string, unknown>;
};

export type TorqueCorrelation = {
  id: string;
  signal_ids: string[];
  created_at: string;
  reason?: string;
  metadata: Record<string, unknown>;
};

export type TorqueBatch = {
  events: TorqueEvent[];
  signals: TorqueSignal[];
  correlations: TorqueCorrelation[];
};

export class TorqueMapper {
  static mapBatch(batch: TorqueBatch): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    for (const evt of batch.events) {
      nodes.push({
        id: evt.id,
        type: "RunEvent",
        createdAt: evt.timestamp,
        labels: { agent_id: evt.agent_id, event_type: evt.type },
        properties: evt.metadata,
      });

      edges.push({
        id: randomUUID(),
        srcId: evt.agent_id,
        dstId: evt.id,
        type: "AGENT_EXECUTED_EVENT",
        createdAt: evt.timestamp,
        properties: {},
      });

      if (evt.repo_id) {
        edges.push({
          id: randomUUID(),
          srcId: evt.id,
          dstId: evt.repo_id,
          type: "EVENT_TOUCHES_REPO",
          createdAt: evt.timestamp,
          properties: {},
        });
      }

      if (evt.file_ids) {
        for (const fileId of evt.file_ids) {
          edges.push({
            id: randomUUID(),
            srcId: evt.id,
            dstId: fileId,
            type: "EVENT_TOUCHES_FILE",
            createdAt: evt.timestamp,
            properties: {},
          });
        }
      }
    }

    for (const sig of batch.signals) {
      nodes.push({
        id: sig.id,
        type: "Signal",
        createdAt: sig.timestamp,
        labels: { kind: sig.kind, severity: sig.severity },
        properties: sig.metadata,
      });

      if (sig.event_id) {
        edges.push({
          id: randomUUID(),
          srcId: sig.event_id,
          dstId: sig.id,
          type: "EVENT_EMITS_SIGNAL",
          createdAt: sig.timestamp,
          properties: {},
        });
      }

      if (sig.agent_id) {
        edges.push({
          id: randomUUID(),
          srcId: sig.id,
          dstId: sig.agent_id,
          type: "SIGNAL_OBSERVED_ON_AGENT",
          createdAt: sig.timestamp,
          properties: {},
        });
      }

      if (sig.repo_id) {
        edges.push({
          id: randomUUID(),
          srcId: sig.id,
          dstId: sig.repo_id,
          type: "SIGNAL_OBSERVED_ON_REPO",
          createdAt: sig.timestamp,
          properties: {},
        });
      }
    }

    for (const corr of batch.correlations) {
      nodes.push({
        id: corr.id,
        type: "CorrelationCluster",
        createdAt: corr.created_at,
        labels: { reason: corr.reason ?? "" },
        properties: corr.metadata,
      });

      for (const sigId of corr.signal_ids) {
        edges.push({
          id: randomUUID(),
          srcId: sigId,
          dstId: corr.id,
          type: "PART_OF_CLUSTER",
          createdAt: corr.created_at,
          properties: {},
        });
      }
    }

    return { nodes, edges };
  }
}
