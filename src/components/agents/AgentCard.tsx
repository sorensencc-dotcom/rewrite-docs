import React from "react";
import { Card } from "../cic/Card";
import { Button } from "../cic/Button";
import { AgentListItem } from "../../types/agents";
import { StatusPill } from "./StatusPill";
import { Metric } from "./Metric";
import { SkillsList } from "./SkillsList";
import "./agent-card.css";

export interface AgentCardProps {
  agent: AgentListItem;
  onSelect?: (agentId: string) => void;
}

const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect }) => {
  return (
    <Card className="agent-card" onClick={() => onSelect?.(agent.id)}>
      <div className="agent-card-header">
        <div>
          <h3 className="agent-card-title">{agent.name}</h3>
          <div className="agent-card-heartbeat">Heartbeat: {formatTimestamp(agent.heartbeat)}</div>
        </div>
        <StatusPill status={agent.status} />
      </div>

      <div className="agent-card-metrics">
        <Metric label="Exec (24h)" value={agent.metrics.executions24h} />
        <Metric label="Errors (24h)" value={agent.metrics.errors24h} />
        <Metric label="Cost (24h)" value={`$${agent.metrics.cost24h.toFixed(2)}`} />
        <Metric label="p95 (ms)" value={agent.metrics.latencyP95} />
      </div>

      <div className="agent-card-skills">
        <SkillsList skills={agent.skills} />
      </div>

      <div className="agent-card-actions">
        <Button variant="secondary" size="small">
          Invoke
        </Button>
        <Button variant="ghost" size="small">
          Pause
        </Button>
        <Button variant="ghost" size="small">
          Restart
        </Button>
        <Button variant="primary" size="small">
          Snapshot
        </Button>
      </div>
    </Card>
  );
};
