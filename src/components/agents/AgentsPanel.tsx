import React, { useState } from "react";
import { Panel } from "../cic/Panel";
import { Grid } from "../cic/Grid";
import { Row } from "../cic/Row";
import { Button } from "../cic/Button";
import { Alert } from "../cic/Alert";
import { AgentCard } from "./AgentCard";
import { useAgentList } from "../../hooks/useAgentList";
import "./agents-panel.css";

export const AgentsPanel: React.FC = () => {
  const { agents, loading, error, refresh, snapshotAll } = useAgentList({
    poll: true,
    stream: true,
  });
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const handleSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      await snapshotAll();
      // TODO: Show success toast
    } catch {
      // TODO: Show error toast
    } finally {
      setSnapshotLoading(false);
    }
  };

  return (
    <Panel className="agents-panel">
      <div className="agents-panel-header">
        <h2>Agents</h2>
        <div className="agents-panel-controls">
          <Button variant="ghost" size="medium" onClick={refresh}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleSnapshot}
            disabled={snapshotLoading}
          >
            Snapshot All
          </Button>
        </div>
      </div>

      {error && <Alert className="alert-error">Failed to load agents: {error.message}</Alert>}
      {loading && <Alert className="alert-info">Loading agents…</Alert>}

      {!loading && agents.length === 0 && !error && (
        <Alert className="alert-info">No agents found</Alert>
      )}

      {agents.length > 0 && (
        <Grid cols={3}>
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </Grid>
      )}
    </Panel>
  );
};
