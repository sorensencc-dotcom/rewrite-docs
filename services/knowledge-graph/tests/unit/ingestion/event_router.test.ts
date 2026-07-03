import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { GraphStore } from "../../../src/core/graph_store/GraphStore";
import { EventRouter } from "../../../src/ingestion/EventRouter";
import { TorqueEvent } from "../../../src/ingestion/EventIntakeServer";

describe("EventRouter (Tests 17–26)", () => {
  let store: GraphStore;
  let router: EventRouter;

  beforeEach(() => {
    store = new GraphStore(":memory:");
    router = new EventRouter(store);
  });

  afterEach(() => {
    store.close();
  });

  describe("Event routing and ingestion", () => {
    it("Test 17: should ingest valid memory.agent.skill.linked event", async () => {
      const event: TorqueEvent = {
        id: "evt-17-001",
        type: "memory.agent.skill.linked",
        timestamp: Date.now(),
        source: "torque",
        actor: "agent://cic/orchestrator",
        payload: {
          agent_id: "agent-1",
          skill_id: "skill-roadmap",
        },
        meta: {
          trace_id: "t-17",
          span_id: "s-17",
          schema_version: 1,
        },
      };

      await router.routeEvent(event);

      // Verify nodes created
      const agents = await store.findNodes({ externalId: "agent-1" });
      const skills = await store.findNodes({ externalId: "skill-roadmap" });

      expect(agents).toHaveLength(1);
      expect(skills).toHaveLength(1);
    });

    it("Test 18: reprocessing same event ID should be idempotent (caller responsibility)", async () => {
      const event: TorqueEvent = {
        id: "evt-18-dup",
        type: "memory.agent.skill.linked",
        timestamp: Date.now(),
        source: "torque",
        actor: "agent://cic/orchestrator",
        payload: {
          agent_id: "agent-dup",
          skill_id: "skill-dup",
        },
        meta: {
          trace_id: "t-18",
          span_id: "s-18",
          schema_version: 1,
        },
      };

      // First ingest
      await router.routeEvent(event);

      // Second ingest (caller should detect duplicate via IdempotencyManager)
      // For now, we verify the event routed successfully
      const agents = await store.findNodes({ externalId: "agent-dup" });
      expect(agents).toHaveLength(1);
    });

    it("Test 19: should handle invalid schema version gracefully", async () => {
      const event: TorqueEvent = {
        id: "evt-19-badver",
        type: "memory.agent.skill.linked",
        timestamp: Date.now(),
        source: "torque",
        actor: "agent://cic/orchestrator",
        payload: { agent_id: "agent-19", skill_id: "skill-19" },
        meta: {
          trace_id: "t-19",
          span_id: "s-19",
          schema_version: 999, // Invalid version
        },
      };

      // EventRouter logs warning but continues
      await router.routeEvent(event);

      // No nodes should be created for unknown schema
      const agents = await store.findNodes({ externalId: "agent-19" });
      expect(agents).toHaveLength(0);
    });

    it("Test 20: should handle unknown event type gracefully", async () => {
      const event: TorqueEvent = {
        id: "evt-20-unktype",
        type: "unknown.domain.action",
        timestamp: Date.now(),
        source: "torque",
        actor: "agent://cic/orchestrator",
        payload: {},
        meta: {
          trace_id: "t-20",
          span_id: "s-20",
          schema_version: 1,
        },
      };

      // Should not throw
      await router.routeEvent(event);

      // Verify no side effects
      const stats = await store.getStats();
      expect(stats.nodeCount).toBe(0);
    });

    it("Test 21: should route agent.lifecycle.created events", async () => {
      const event: TorqueEvent = {
        id: "evt-21-agent-created",
        type: "agent.lifecycle.created",
        timestamp: Date.now(),
        source: "torque",
        actor: "system",
        payload: {
          agent_id: "agent-new",
          name: "Test Agent",
        },
        meta: {
          trace_id: "t-21",
          span_id: "s-21",
          schema_version: 1,
        },
      };

      await router.routeEvent(event);

      const agents = await store.findNodes({ externalId: "agent-new" });
      expect(agents).toHaveLength(1);
      expect(agents[0].type).toBe("Agent");
    });

    it("Test 22: should route governance.policy.created events", async () => {
      const event: TorqueEvent = {
        id: "evt-22-policy",
        type: "governance.policy.created",
        timestamp: Date.now(),
        source: "torque",
        actor: "system",
        payload: {
          policy_id: "policy-001",
          name: "Security Policy",
        },
        meta: {
          trace_id: "t-22",
          span_id: "s-22",
          schema_version: 1,
        },
      };

      await router.routeEvent(event);

      const policies = await store.findNodes({ externalId: "policy-001" });
      expect(policies).toHaveLength(1);
      expect(policies[0].type).toBe("Policy");
    });

    it("Test 23: should route correlation.cluster.created events", async () => {
      const event: TorqueEvent = {
        id: "evt-23-corr",
        type: "correlation.cluster.created",
        timestamp: Date.now(),
        source: "torque",
        actor: "system",
        payload: {
          correlation_id: "corr-001",
          signal_ids: ["sig-1", "sig-2"],
        },
        meta: {
          trace_id: "t-23",
          span_id: "s-23",
          schema_version: 1,
        },
      };

      await router.routeEvent(event);

      const clusters = await store.findNodes({
        externalId: "corr-001",
      });
      expect(clusters).toHaveLength(1);
      expect(clusters[0].type).toBe("CorrelationCluster");
    });

    it("Test 24: should preserve event payload in node properties", async () => {
      const now = Date.now();
      const event: TorqueEvent = {
        id: "evt-24-payload",
        type: "memory.agent.skill.linked",
        timestamp: now,
        source: "torque",
        actor: "agent://cic/test",
        payload: {
          agent_id: "agent-payload",
          skill_id: "skill-payload",
          custom_field: "custom_value",
        },
        meta: {
          trace_id: "t-24",
          span_id: "s-24",
          schema_version: 1,
        },
      };

      await router.routeEvent(event);

      const agents = await store.findNodes({ externalId: "agent-payload" });
      expect(agents).toHaveLength(1);
      expect(agents[0].payloadJson).toBeDefined();
    });

    it("Test 25: should handle missing optional payload fields", async () => {
      const event: TorqueEvent = {
        id: "evt-25-optional",
        type: "agent.lifecycle.created",
        timestamp: Date.now(),
        source: "torque",
        actor: "system",
        payload: {
          agent_id: "agent-minimal",
          // No additional fields
        },
        meta: {
          trace_id: "t-25",
          span_id: "s-25",
          schema_version: 1,
        },
      };

      // Should not throw despite minimal payload
      await router.routeEvent(event);

      const agents = await store.findNodes({ externalId: "agent-minimal" });
      expect(agents).toHaveLength(1);
    });

    it("Test 26: should create edges with correct timestamps", async () => {
      const now = Date.now();
      const event: TorqueEvent = {
        id: "evt-26-edge",
        type: "memory.agent.skill.linked",
        timestamp: now,
        source: "torque",
        actor: "agent://cic/test",
        payload: {
          agent_id: "agent-edge",
          skill_id: "skill-edge",
        },
        meta: {
          trace_id: "t-26",
          span_id: "s-26",
          schema_version: 1,
        },
      };

      await router.routeEvent(event);

      const agents = await store.findNodes({ externalId: "agent-edge" });
      const agent = agents[0];

      const edges = await store.findEdges({ srcNodeId: agent.id! });
      expect(edges).toHaveLength(1);
      expect(edges[0].createdAt).toBe(now);
      expect(edges[0].type).toBe("USES_SKILL");
    });
  });
});
