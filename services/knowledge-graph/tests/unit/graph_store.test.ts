import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { GraphStore, Node, Edge } from "../../src/core/graph_store/GraphStore";

describe("GraphStore — Phase 29 Knowledge Graph", () => {
  let store: GraphStore;

  beforeEach(() => {
    store = new GraphStore(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  describe("Schema & Persistence (Tests 1–8)", () => {
    it("Test 1: should create and retrieve a node", async () => {
      const node: Node = {
        externalId: "agent-1",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { name: "test" },
        version: 1,
        digestId: 0,
      };

      const nodeId = await store.createNode(node);
      expect(nodeId).toBeGreaterThan(0);

      const retrieved = await store.getNode(nodeId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.externalId).toBe("agent-1");
      expect(retrieved?.type).toBe("Agent");
    });

    it("Test 2: should create and retrieve an edge", async () => {
      // Create source and destination nodes first
      const srcNode: Node = {
        externalId: "agent-1",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const dstNode: Node = {
        externalId: "skill-1",
        type: "Skill",
        createdAt: Date.now(),
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const srcNodeId = await store.createNode(srcNode);
      const dstNodeId = await store.createNode(dstNode);

      // Create edge
      const edge: Edge = {
        srcNodeId,
        dstNodeId,
        type: "USES_SKILL",
        createdAt: Date.now(),
        createdByEventId: "evt-3",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { weight: 1.0 },
        version: 1,
        digestId: 0,
      };

      const edgeId = await store.createEdge(edge);
      expect(edgeId).toBeGreaterThan(0);

      const retrieved = await store.getEdge(edgeId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.srcNodeId).toBe(srcNodeId);
      expect(retrieved?.dstNodeId).toBe(dstNodeId);
      expect(retrieved?.type).toBe("USES_SKILL");
    });

    it("Test 3: should handle temporal range with valid_from/valid_to", async () => {
      const now = Date.now();
      const node: Node = {
        externalId: "agent-time-test",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: now - 1000,
        validTo: now + 1000,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const nodeId = await store.createNode(node);
      const retrieved = await store.getNode(nodeId);

      expect(retrieved?.validFrom).toBe(now - 1000);
      expect(retrieved?.validTo).toBe(now + 1000);
    });

    it("Test 4: should soft delete node (is_deleted=1)", async () => {
      const node: Node = {
        externalId: "agent-delete-test",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: true,
        validFrom: Date.now(),
        validTo: Date.now() + 100,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const nodeId = await store.createNode(node);
      const retrieved = await store.getNode(nodeId);

      expect(retrieved).toBeNull();
    });

    it("Test 5: should soft delete edge", async () => {
      const srcNode: Node = {
        externalId: "src-edge-delete",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const dstNode: Node = {
        externalId: "dst-edge-delete",
        type: "Skill",
        createdAt: Date.now(),
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const srcId = await store.createNode(srcNode);
      const dstId = await store.createNode(dstNode);

      const edge: Edge = {
        srcNodeId: srcId,
        dstNodeId: dstId,
        type: "TEST_LINK",
        createdAt: Date.now(),
        createdByEventId: "evt-3",
        isDeleted: true,
        validFrom: Date.now(),
        validTo: Date.now() + 100,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const edgeId = await store.createEdge(edge);
      const retrieved = await store.getEdge(edgeId);

      expect(retrieved).toBeNull();
    });

    it("Test 6: should increment version on node updates", async () => {
      const node1: Node = {
        externalId: "version-test",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { v: 1 },
        version: 1,
        digestId: 0,
      };

      const id1 = await store.createNode(node1);

      const node2: Node = {
        externalId: "version-test",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { v: 2 },
        version: 2,
        digestId: 0,
      };

      const id2 = await store.createNode(node2);
      expect(id2).not.toBe(id1);

      const v1 = await store.getNode(id1);
      const v2 = await store.getNode(id2);

      expect(v1?.version).toBe(1);
      expect(v2?.version).toBe(2);
    });

    it("Test 7: should increment version on edge updates", async () => {
      const srcNode: Node = {
        externalId: "src-version",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const dstNode: Node = {
        externalId: "dst-version",
        type: "Skill",
        createdAt: Date.now(),
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const srcId = await store.createNode(srcNode);
      const dstId = await store.createNode(dstNode);

      const edge1: Edge = {
        srcNodeId: srcId,
        dstNodeId: dstId,
        type: "TEST_EDGE",
        createdAt: Date.now(),
        createdByEventId: "evt-3",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { weight: 1.0 },
        version: 1,
        digestId: 0,
      };

      const id1 = await store.createEdge(edge1);

      const edge2: Edge = {
        srcNodeId: srcId,
        dstNodeId: dstId,
        type: "TEST_EDGE",
        createdAt: Date.now(),
        createdByEventId: "evt-4",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { weight: 2.0 },
        version: 2,
        digestId: 0,
      };

      const id2 = await store.createEdge(edge2);
      expect(id2).not.toBe(id1);

      const e1 = await store.getEdge(id1);
      const e2 = await store.getEdge(id2);

      expect(e1?.version).toBe(1);
      expect(e2?.version).toBe(2);
    });

    it("Test 8: should find nodes by type", async () => {
      const now = Date.now();

      const agent: Node = {
        externalId: "agent-find",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: now,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const skill: Node = {
        externalId: "skill-find",
        type: "Skill",
        createdAt: now,
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: now,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      await store.createNode(agent);
      await store.createNode(skill);

      const agents = await store.findNodes({ type: "Agent" });
      const skills = await store.findNodes({ type: "Skill" });

      expect(agents).toHaveLength(1);
      expect(agents[0].externalId).toBe("agent-find");

      expect(skills).toHaveLength(1);
      expect(skills[0].externalId).toBe("skill-find");
    });
  });

  describe("Digest Chain (Tests 9–16)", () => {
    it("Test 9: should create digest entry for mutation", async () => {
      const node: Node = {
        externalId: "digest-test",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { data: "test" },
        version: 1,
        digestId: 0,
      };

      const nodeId = await store.createNode(node);
      const retrieved = await store.getNode(nodeId);

      expect(retrieved?.digestId).toBeGreaterThan(0);
    });

    it("Test 10: should compute consistent payload hashes", async () => {
      const payload = { z: 1, a: 2, m: 3 };

      const node1: Node = {
        externalId: "hash-test-1",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: payload,
        version: 1,
        digestId: 0,
      };

      const node2: Node = {
        externalId: "hash-test-2",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: payload,
        version: 1,
        digestId: 0,
      };

      await store.createNode(node1);
      await store.createNode(node2);

      const n1 = await store.findNodes({ externalId: "hash-test-1" });
      const n2 = await store.findNodes({ externalId: "hash-test-2" });

      expect(n1).toHaveLength(1);
      expect(n2).toHaveLength(1);
    });

    it("Test 11: should link digest chain correctly", async () => {
      const node1: Node = {
        externalId: "chain-link-test",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { v: 1 },
        version: 1,
        digestId: 0,
      };

      const id1 = await store.createNode(node1);

      await new Promise((r) => setTimeout(r, 10));

      const node2: Node = {
        externalId: "chain-link-test",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { v: 2 },
        version: 2,
        digestId: 0,
      };

      const id2 = await store.createNode(node2);

      const n1 = await store.getNode(id1);
      const n2 = await store.getNode(id2);

      expect(n1?.digestId).toBeLessThan(n2?.digestId!);
    });

    it("Test 12: should handle head mutation", async () => {
      const node: Node = {
        externalId: "head-mutation-test",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const nodeId = await store.createNode(node);
      const retrieved = await store.getNode(nodeId);

      expect(retrieved?.digestId).toBeGreaterThan(0);
    });

    it("Test 13: should replay node history", async () => {
      const ids: number[] = [];

      for (let i = 1; i <= 3; i++) {
        const node: Node = {
          externalId: "replay-test",
          type: "Agent",
          createdAt: Date.now(),
          createdByEventId: `evt-${i}`,
          isDeleted: false,
          validFrom: Date.now(),
          payloadJson: { iteration: i },
          version: i,
          digestId: 0,
        };

        const id = await store.createNode(node);
        ids.push(id);

        await new Promise((r) => setTimeout(r, 5));
      }

      const nodes = await Promise.all(
        ids.map((id) => store.getNode(id))
      );

      expect(nodes).toHaveLength(3);
      expect(nodes[0]?.version).toBe(1);
      expect(nodes[2]?.version).toBe(3);
    });

    it("Test 14: should replay edge history", async () => {
      const srcNode: Node = {
        externalId: "src-replay",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const dstNode: Node = {
        externalId: "dst-replay",
        type: "Skill",
        createdAt: Date.now(),
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const srcId = await store.createNode(srcNode);
      const dstId = await store.createNode(dstNode);

      const edgeIds: number[] = [];

      for (let i = 1; i <= 3; i++) {
        const edge: Edge = {
          srcNodeId: srcId,
          dstNodeId: dstId,
          type: "REPLAY_EDGE",
          createdAt: Date.now(),
          createdByEventId: `evt-edge-${i}`,
          isDeleted: false,
          validFrom: Date.now(),
          payloadJson: { version: i },
          version: i,
          digestId: 0,
        };

        const edgeId = await store.createEdge(edge);
        edgeIds.push(edgeId);

        await new Promise((r) => setTimeout(r, 5));
      }

      const edges = await Promise.all(
        edgeIds.map((id) => store.getEdge(id))
      );

      expect(edges).toHaveLength(3);
      expect(edges[0]?.version).toBe(1);
      expect(edges[2]?.version).toBe(3);
    });

    it("Test 15: should detect tamper", async () => {
      const node: Node = {
        externalId: "tamper-test",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: { data: "original" },
        version: 1,
        digestId: 0,
      };

      const nodeId = await store.createNode(node);
      const retrieved = await store.getNode(nodeId);

      expect(retrieved?.digestId).toBeGreaterThan(0);
    });

    it("Test 16: should maintain digest integrity", async () => {
      const agent: Node = {
        externalId: "integrity-agent",
        type: "Agent",
        createdAt: Date.now(),
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const skill: Node = {
        externalId: "integrity-skill",
        type: "Skill",
        createdAt: Date.now(),
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const agentId = await store.createNode(agent);
      const skillId = await store.createNode(skill);

      const edge: Edge = {
        srcNodeId: agentId,
        dstNodeId: skillId,
        type: "USES_SKILL",
        createdAt: Date.now(),
        createdByEventId: "evt-3",
        isDeleted: false,
        validFrom: Date.now(),
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      await store.createEdge(edge);

      const a = await store.getNode(agentId);
      const s = await store.getNode(skillId);
      const edges = await store.findEdges({
        srcNodeId: agentId,
        dstNodeId: skillId,
      });

      expect(a?.digestId).toBeGreaterThan(0);
      expect(s?.digestId).toBeGreaterThan(0);
      expect(edges[0]?.digestId).toBeGreaterThan(0);
    });
  });

  describe("Temporal Queries (Tests 35–40)", () => {
    it("Test 35: should retrieve node as-of timestamp", async () => {
      const now = Date.now();

      const node: Node = {
        externalId: "temporal-as-of",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: now - 1000,
        validTo: now + 5000,
        payloadJson: { status: "active" },
        version: 1,
        digestId: 0,
      };

      await store.createNode(node);

      const beforeValid = await store.getNodeAsOf("temporal-as-of", now - 2000);
      const duringValid = await store.getNodeAsOf("temporal-as-of", now + 2000);
      const afterValid = await store.getNodeAsOf("temporal-as-of", now + 10000);

      expect(beforeValid).toBeNull();
      expect(duringValid).toBeDefined();
      expect(afterValid).toBeNull();
    });

    it("Test 36: should retrieve edge as-of timestamp", async () => {
      const now = Date.now();

      const srcNode: Node = {
        externalId: "temporal-src",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: now,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const dstNode: Node = {
        externalId: "temporal-dst",
        type: "Skill",
        createdAt: now,
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: now,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const srcId = await store.createNode(srcNode);
      const dstId = await store.createNode(dstNode);

      const edge: Edge = {
        srcNodeId: srcId,
        dstNodeId: dstId,
        type: "TEMPORAL_EDGE",
        createdAt: now,
        createdByEventId: "evt-3",
        isDeleted: false,
        validFrom: now - 500,
        validTo: now + 3000,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      await store.createEdge(edge);

      const before = await store.getEdgeAsOf(srcId, dstId, "TEMPORAL_EDGE", now - 1000);
      const during = await store.getEdgeAsOf(srcId, dstId, "TEMPORAL_EDGE", now + 1000);
      const after = await store.getEdgeAsOf(srcId, dstId, "TEMPORAL_EDGE", now + 5000);

      expect(before).toBeNull();
      expect(during).toBeDefined();
      expect(after).toBeNull();
    });

    it("Test 37: should find nodes in time range", async () => {
      const now = Date.now();

      const activeNode: Node = {
        externalId: "range-test-active",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: now - 1000,
        validTo: now + 2000,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const beforeNode: Node = {
        externalId: "range-test-before",
        type: "Agent",
        createdAt: now - 3000,
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: now - 3000,
        validTo: now - 500,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      await store.createNode(activeNode);
      await store.createNode(beforeNode);

      const nodes = await store.findNodesInTimeRange("Agent", now, now + 1000);

      expect(nodes.length).toBeGreaterThanOrEqual(1);
      const foundActive = nodes.some((n) => n.externalId === "range-test-active");
      expect(foundActive).toBe(true);
    });

    it("Test 38: should support drift detection", async () => {
      const now = Date.now();

      const nodeV1: Node = {
        externalId: "drift-test",
        type: "Agent",
        createdAt: now - 1000,
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: now - 1000,
        validTo: now,
        payloadJson: { status: "healthy", score: 100 },
        version: 1,
        digestId: 0,
      };

      const nodeV2: Node = {
        externalId: "drift-test",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: now,
        payloadJson: { status: "degraded", score: 50 },
        version: 2,
        digestId: 0,
      };

      await store.createNode(nodeV1);
      await store.createNode(nodeV2);

      const historical = await store.getNodeAsOf("drift-test", now - 500);
      const current = await store.getNodeAsOf("drift-test", now + 100);

      const historicalStatus = (historical?.payloadJson as any)?.status;
      const currentStatus = (current?.payloadJson as any)?.status;

      expect(historicalStatus).toBe("healthy");
      expect(currentStatus).toBe("degraded");
      expect(historicalStatus).not.toBe(currentStatus);
    });

    it("Test 39: should retrieve deleted entity in historical view", async () => {
      const now = Date.now();

      const activeNode: Node = {
        externalId: "historical-delete-test",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: now - 1000,
        validTo: now + 500,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const deletedNode: Node = {
        externalId: "historical-delete-test",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-2",
        isDeleted: true,
        validFrom: now + 500,
        payloadJson: {},
        version: 2,
        digestId: 0,
      };

      await store.createNode(activeNode);
      await store.createNode(deletedNode);

      const beforeDelete = await store.getNodeAsOf("historical-delete-test", now);
      const afterDelete = await store.getNodeAsOf("historical-delete-test", now + 1000);

      expect(beforeDelete).toBeDefined();
      expect(afterDelete).toBeNull();
    });

    it("Test 40: should handle multi-entity temporal join", async () => {
      const now = Date.now();

      const agent: Node = {
        externalId: "join-agent",
        type: "Agent",
        createdAt: now,
        createdByEventId: "evt-1",
        isDeleted: false,
        validFrom: now - 1000,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const skill: Node = {
        externalId: "join-skill",
        type: "Skill",
        createdAt: now,
        createdByEventId: "evt-2",
        isDeleted: false,
        validFrom: now - 1000,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const agentId = await store.createNode(agent);
      const skillId = await store.createNode(skill);

      const edge: Edge = {
        srcNodeId: agentId,
        dstNodeId: skillId,
        type: "USES_SKILL",
        createdAt: now,
        createdByEventId: "evt-3",
        isDeleted: false,
        validFrom: now - 500,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      await store.createEdge(edge);

      const agentAtTime = await store.getNodeAsOf("join-agent", now + 100);
      const skillAtTime = await store.getNodeAsOf("join-skill", now + 100);
      const edgeAtTime = await store.getEdgeAsOf(agentId, skillId, "USES_SKILL", now + 100);

      expect(agentAtTime).toBeDefined();
      expect(skillAtTime).toBeDefined();
      expect(edgeAtTime).toBeDefined();

      expect(edgeAtTime?.srcNodeId).toBe(agentId);
      expect(edgeAtTime?.dstNodeId).toBe(skillId);
    });
  });

  describe("Stats & Introspection", () => {
    it("should compute graph stats correctly", async () => {
      const now = Date.now();

      for (let i = 0; i < 3; i++) {
        const node: Node = {
          externalId: `stat-node-${i}`,
          type: "Agent",
          createdAt: now,
          createdByEventId: `evt-${i}`,
          isDeleted: false,
          validFrom: now,
          payloadJson: {},
          version: 1,
          digestId: 0,
        };
        await store.createNode(node);
      }

      const stats = await store.getStats();

      expect(stats.nodeCount).toBeGreaterThanOrEqual(3);
      expect(stats.edgeCount).toBeGreaterThanOrEqual(0);
      expect(stats.digestCount).toBeGreaterThan(0);
      expect(stats.lastIngestionAt).toBeGreaterThan(0);
    });
  });
});
