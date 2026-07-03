import { TorqueMapper, TorqueBatch } from "../../../src/core/mappers/TorqueMapper";

describe("TorqueMapper", () => {
  describe("mapBatch", () => {
    it("should map event → RunEvent node + AGENT_EXECUTED_EVENT edge", () => {
      const batch: TorqueBatch = {
        events: [
          {
            id: "evt-1",
            agent_id: "agent-1",
            timestamp: "2025-01-01T10:00:00Z",
            type: "build",
            metadata: { branch: "main" },
          },
        ],
        signals: [],
        correlations: [],
      };

      const { nodes, edges } = TorqueMapper.mapBatch(batch);

      expect(nodes.some((n) => n.id === "evt-1" && n.type === "RunEvent")).toBe(true);
      expect(edges.some((e) => e.srcId === "agent-1" && e.dstId === "evt-1" && e.type === "AGENT_EXECUTED_EVENT")).toBe(true);
    });

    it("should map event with repo → EVENT_TOUCHES_REPO edge", () => {
      const batch: TorqueBatch = {
        events: [
          {
            id: "evt-2",
            agent_id: "agent-1",
            timestamp: "2025-01-01T10:00:00Z",
            type: "build",
            repo_id: "repo-42",
            metadata: {},
          },
        ],
        signals: [],
        correlations: [],
      };

      const { edges } = TorqueMapper.mapBatch(batch);

      expect(edges.some((e) => e.srcId === "evt-2" && e.dstId === "repo-42" && e.type === "EVENT_TOUCHES_REPO")).toBe(true);
    });

    it("should map event with file_ids → EVENT_TOUCHES_FILE edges", () => {
      const batch: TorqueBatch = {
        events: [
          {
            id: "evt-3",
            agent_id: "agent-1",
            timestamp: "2025-01-01T10:00:00Z",
            type: "build",
            file_ids: ["file-1", "file-2"],
            metadata: {},
          },
        ],
        signals: [],
        correlations: [],
      };

      const { edges } = TorqueMapper.mapBatch(batch);

      const fileEdges = edges.filter((e) => e.type === "EVENT_TOUCHES_FILE");
      expect(fileEdges.length).toBe(2);
      expect(fileEdges.some((e) => e.dstId === "file-1")).toBe(true);
      expect(fileEdges.some((e) => e.dstId === "file-2")).toBe(true);
    });

    it("should map signal → Signal node + EVENT_EMITS_SIGNAL edge", () => {
      const batch: TorqueBatch = {
        events: [],
        signals: [
          {
            id: "sig-1",
            kind: "drift",
            severity: "high",
            timestamp: "2025-01-01T10:05:00Z",
            event_id: "evt-1",
            metadata: { drift_type: "config" },
          },
        ],
        correlations: [],
      };

      const { nodes, edges } = TorqueMapper.mapBatch(batch);

      expect(nodes.some((n) => n.id === "sig-1" && n.type === "Signal")).toBe(true);
      expect(edges.some((e) => e.srcId === "evt-1" && e.dstId === "sig-1" && e.type === "EVENT_EMITS_SIGNAL")).toBe(true);
    });

    it("should map signal with agent_id → SIGNAL_OBSERVED_ON_AGENT edge", () => {
      const batch: TorqueBatch = {
        events: [],
        signals: [
          {
            id: "sig-2",
            kind: "health",
            severity: "low",
            timestamp: "2025-01-01T10:05:00Z",
            agent_id: "agent-1",
            metadata: {},
          },
        ],
        correlations: [],
      };

      const { edges } = TorqueMapper.mapBatch(batch);

      expect(edges.some((e) => e.srcId === "sig-2" && e.dstId === "agent-1" && e.type === "SIGNAL_OBSERVED_ON_AGENT")).toBe(true);
    });

    it("should map signal with repo_id → SIGNAL_OBSERVED_ON_REPO edge", () => {
      const batch: TorqueBatch = {
        events: [],
        signals: [
          {
            id: "sig-3",
            kind: "anomaly",
            severity: "medium",
            timestamp: "2025-01-01T10:05:00Z",
            repo_id: "repo-42",
            metadata: {},
          },
        ],
        correlations: [],
      };

      const { edges } = TorqueMapper.mapBatch(batch);

      expect(edges.some((e) => e.srcId === "sig-3" && e.dstId === "repo-42" && e.type === "SIGNAL_OBSERVED_ON_REPO")).toBe(true);
    });

    it("should map correlation → CorrelationCluster node + PART_OF_CLUSTER edges", () => {
      const batch: TorqueBatch = {
        events: [],
        signals: [],
        correlations: [
          {
            id: "corr-1",
            signal_ids: ["sig-1", "sig-2"],
            created_at: "2025-01-01T10:06:00Z",
            reason: "config drift",
            metadata: {},
          },
        ],
      };

      const { nodes, edges } = TorqueMapper.mapBatch(batch);

      expect(nodes.some((n) => n.id === "corr-1" && n.type === "CorrelationCluster")).toBe(true);
      const clusterEdges = edges.filter((e) => e.dstId === "corr-1" && e.type === "PART_OF_CLUSTER");
      expect(clusterEdges.length).toBe(2);
    });

    it("should handle complete batch with events, signals, and correlations", () => {
      const batch: TorqueBatch = {
        events: [
          {
            id: "evt-complete",
            agent_id: "agent-x",
            timestamp: "2025-01-01T10:00:00Z",
            type: "deploy",
            repo_id: "repo-x",
            metadata: { version: "1.0.0" },
          },
        ],
        signals: [
          {
            id: "sig-complete",
            kind: "drift",
            severity: "high",
            timestamp: "2025-01-01T10:05:00Z",
            event_id: "evt-complete",
            agent_id: "agent-x",
            repo_id: "repo-x",
            metadata: {},
          },
        ],
        correlations: [
          {
            id: "corr-complete",
            signal_ids: ["sig-complete"],
            created_at: "2025-01-01T10:06:00Z",
            reason: "post-deploy drift",
            metadata: {},
          },
        ],
      };

      const { nodes, edges } = TorqueMapper.mapBatch(batch);

      expect(nodes.length).toBeGreaterThan(0);
      expect(edges.length).toBeGreaterThan(0);
      expect(nodes.some((n) => n.type === "RunEvent")).toBe(true);
      expect(nodes.some((n) => n.type === "Signal")).toBe(true);
      expect(nodes.some((n) => n.type === "CorrelationCluster")).toBe(true);
    });
  });
});
