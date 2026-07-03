import { GraphStore, Node, Edge } from "../core/graph_store/GraphStore";
import { TorqueEvent } from "./EventIntakeServer";

export class EventRouter {
  constructor(private store: GraphStore) {}

  async routeEvent(event: TorqueEvent): Promise<void> {
    const [domain, resource, action] = event.type.split(".");

    if (domain === "memory") {
      await this.handleMemoryEvent(event);
    } else if (domain === "agent") {
      await this.handleAgentEvent(event);
    } else if (domain === "governance") {
      await this.handleGovernanceEvent(event);
    } else if (domain === "correlation") {
      await this.handleCorrelationEvent(event);
    } else {
      console.warn(`Unknown event domain: ${domain}`);
    }
  }

  private async handleMemoryEvent(event: TorqueEvent): Promise<void> {
    const { agent_id, memory_type, skill_id, repo_id } = event.payload as any;

    // Memory.agent.skill.linked
    if (event.type === "memory.agent.skill.linked") {
      // Create or update agent node
      const agentNode: Node = {
        externalId: agent_id,
        type: "Agent",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: false,
        validFrom: event.timestamp,
        payloadJson: { actor: event.actor },
        version: 1,
        digestId: 0,
      };

      const agentId = await this.store.createNode(agentNode);

      // Create skill node
      const skillNode: Node = {
        externalId: skill_id,
        type: "Skill",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: false,
        validFrom: event.timestamp,
        payloadJson: {},
        version: 1,
        digestId: 0,
      };

      const skillId = await this.store.createNode(skillNode);

      // Create edge: agent uses skill
      const edge: Edge = {
        srcNodeId: agentId,
        dstNodeId: skillId,
        type: "USES_SKILL",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: false,
        validFrom: event.timestamp,
        payloadJson: { linked_at: event.timestamp },
        version: 1,
        digestId: 0,
      };

      await this.store.createEdge(edge);
    }

    // Memory.repo.ingested
    if (event.type === "memory.repo.ingested") {
      const repoNode: Node = {
        externalId: repo_id,
        type: "Repo",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: false,
        validFrom: event.timestamp,
        payloadJson: event.payload,
        version: 1,
        digestId: 0,
      };

      await this.store.createNode(repoNode);
    }
  }

  private async handleAgentEvent(event: TorqueEvent): Promise<void> {
    const { agent_id } = event.payload as any;

    // Agent.lifecycle.created
    if (event.type === "agent.lifecycle.created") {
      const agentNode: Node = {
        externalId: agent_id,
        type: "Agent",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: false,
        validFrom: event.timestamp,
        payloadJson: event.payload,
        version: 1,
        digestId: 0,
      };

      await this.store.createNode(agentNode);
    }

    // Agent.lifecycle.deleted
    if (event.type === "agent.lifecycle.deleted") {
      const agentNode: Node = {
        externalId: agent_id,
        type: "Agent",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: true,
        validFrom: event.timestamp,
        payloadJson: event.payload,
        version: 1,
        digestId: 0,
      };

      await this.store.createNode(agentNode);
    }
  }

  private async handleGovernanceEvent(event: TorqueEvent): Promise<void> {
    const { record_id, policy_id, rule_type } = event.payload as any;

    // Governance.policy.created
    if (event.type === "governance.policy.created") {
      const policyNode: Node = {
        externalId: policy_id,
        type: "Policy",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: false,
        validFrom: event.timestamp,
        payloadJson: event.payload,
        version: 1,
        digestId: 0,
      };

      await this.store.createNode(policyNode);
    }

    // Governance.record.created
    if (event.type === "governance.record.created") {
      const recordNode: Node = {
        externalId: record_id,
        type: "GovernanceRecord",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: false,
        validFrom: event.timestamp,
        payloadJson: event.payload,
        version: 1,
        digestId: 0,
      };

      await this.store.createNode(recordNode);
    }
  }

  private async handleCorrelationEvent(event: TorqueEvent): Promise<void> {
    const { signal_ids, correlation_id } = event.payload as any;

    // Correlation.cluster.created
    if (event.type === "correlation.cluster.created") {
      const clusterNode: Node = {
        externalId: correlation_id,
        type: "CorrelationCluster",
        createdAt: event.timestamp,
        createdByEventId: event.id,
        isDeleted: false,
        validFrom: event.timestamp,
        payloadJson: event.payload,
        version: 1,
        digestId: 0,
      };

      await this.store.createNode(clusterNode);
    }
  }
}
