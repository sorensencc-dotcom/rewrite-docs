import React, { useState } from "react";
import { Panel } from "../cic/Panel";
import { Tabs } from "../cic/Tabs";
import { Button } from "../cic/Button";
import { Alert } from "../cic/Alert";
import { Row } from "../cic/Row";
import { useAgent } from "../../hooks/useAgent";
import { StatusPill } from "./StatusPill";
import { Metric } from "./Metric";
import { SkillsList } from "./SkillsList";
import "./agent-detail-panel.css";

export interface AgentDetailPanelProps {
  agentId: string;
}

const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleString();
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const OverviewTab: React.FC<{ agentId: string }> = ({ agentId }) => {
  const { agent } = useAgent(agentId, { poll: false, stream: false });

  if (!agent) return <Alert>Loading agent...</Alert>;

  return (
    <div className="agent-detail-tab">
      <h4>Metrics</h4>
      <div className="metrics-grid">
        <Metric label="Executions (24h)" value={agent.metrics.executions24h} />
        <Metric label="Errors (24h)" value={agent.metrics.errors24h} />
        <Metric label="Cost (24h)" value={`$${agent.metrics.cost24h.toFixed(2)}`} />
        <Metric label="Latency p95" value={`${agent.metrics.latencyP95}ms`} />
      </div>

      <h4>Skills</h4>
      <SkillsList skills={agent.skills} />

      <h4>Configuration</h4>
      <div className="config-grid">
        <div>
          <span>Max Concurrency:</span>
          <strong>{agent.config.maxConcurrency}</strong>
        </div>
        <div>
          <span>Warm Pool:</span>
          <strong>{agent.config.warmPool ? "Enabled" : "Disabled"}</strong>
        </div>
        <div>
          <span>Version:</span>
          <strong>{agent.config.version}</strong>
        </div>
      </div>
    </div>
  );
};

const LogsTab: React.FC<{ agentId: string }> = ({ agentId }) => {
  const { logs } = useAgent(agentId);

  if (logs.length === 0) {
    return <Alert>No logs yet</Alert>;
  }

  return (
    <div className="agent-detail-tab">
      <div className="logs-list">
        {logs.map((log, idx) => (
          <div key={idx} className={`log-entry log-entry--${log.level}`}>
            <span className="log-time">{formatTimestamp(log.ts)}</span>
            <span className="log-level">{log.level.toUpperCase()}</span>
            {log.skill && <span className="log-skill">{log.skill}</span>}
            {log.correlationId && <span className="log-corr">{log.correlationId}</span>}
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExecutionsTab: React.FC<{ agentId: string }> = ({ agentId }) => {
  const { executions } = useAgent(agentId);

  if (executions.length === 0) {
    return <Alert>No executions yet</Alert>;
  }

  return (
    <div className="agent-detail-tab">
      <table className="executions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Skill</th>
            <th>Duration</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Started At</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((exec) => (
            <tr key={exec.id}>
              <td>{exec.id}</td>
              <td>{exec.skill}</td>
              <td>{formatDuration(exec.durationMs)}</td>
              <td>${exec.costUsd.toFixed(2)}</td>
              <td className={`status-${exec.status}`}>{exec.status}</td>
              <td>{formatTimestamp(exec.startedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SystemTab: React.FC<{ agentId: string }> = ({ agentId }) => {
  const { agent } = useAgent(agentId, { poll: false, stream: false });

  if (!agent) return <Alert>Loading agent...</Alert>;

  return (
    <div className="agent-detail-tab">
      <div className="system-grid">
        <div>
          <span>Version:</span>
          <strong>{agent.config.version}</strong>
        </div>
        <div>
          <span>Warm Pool:</span>
          <strong>{agent.config.warmPool ? "Enabled" : "Disabled"}</strong>
        </div>
        <div>
          <span>Memory:</span>
          <strong>{agent.system.memoryMB} MB</strong>
        </div>
        <div>
          <span>Last Restart:</span>
          <strong>{formatTimestamp(agent.system.lastRestart)}</strong>
        </div>
        <div>
          <span>Restart Reason:</span>
          <strong>{agent.system.restartReason}</strong>
        </div>
      </div>
    </div>
  );
};

export const AgentDetailPanel: React.FC<AgentDetailPanelProps> = ({ agentId }) => {
  const { agent, loading, error, actions } = useAgent(agentId);
  const [invokeLoading, setInvokeLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  if (loading || !agent) {
    return <Panel><Alert>Loading agent...</Alert></Panel>;
  }

  if (error || !agent) {
    return <Panel><Alert>Failed to load agent</Alert></Panel>;
  }

  return (
    <Panel className="agent-detail-panel">
      <div className="agent-detail-header">
        <div>
          <h2>{agent.name}</h2>
          <StatusPill status={agent.status} />
          <div>Heartbeat: {formatTimestamp(agent.heartbeat)}</div>
        </div>
      </div>

      <Tabs defaultTab="overview">
        <Tabs.Tab id="overview" label="Overview">
          <OverviewTab agentId={agentId} />
        </Tabs.Tab>
        <Tabs.Tab id="logs" label="Logs">
          <LogsTab agentId={agentId} />
        </Tabs.Tab>
        <Tabs.Tab id="executions" label="Executions">
          <ExecutionsTab agentId={agentId} />
        </Tabs.Tab>
        <Tabs.Tab id="system" label="System">
          <SystemTab agentId={agentId} />
        </Tabs.Tab>
      </Tabs>

      <div className="agent-detail-footer">
        <Button
          variant="primary"
          onClick={async () => {
            setInvokeLoading(true);
            try {
              await actions.invoke();
            } finally {
              setInvokeLoading(false);
            }
          }}
          disabled={invokeLoading}
        >
          Invoke
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            setPauseLoading(true);
            try {
              await actions.pause();
            } finally {
              setPauseLoading(false);
            }
          }}
          disabled={pauseLoading}
        >
          Pause
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            setRestartLoading(true);
            try {
              await actions.restart();
            } finally {
              setRestartLoading(false);
            }
          }}
          disabled={restartLoading}
        >
          Restart
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            setSnapshotLoading(true);
            try {
              await actions.snapshot();
            } finally {
              setSnapshotLoading(false);
            }
          }}
          disabled={snapshotLoading}
        >
          Snapshot
        </Button>
      </div>
    </Panel>
  );
};
