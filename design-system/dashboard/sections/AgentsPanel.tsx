import React from "react";
import { useAgentsList, useAgentHealth } from "../hooks";

export function AgentsPanel() {
  const { data: agents, isLoading, error, refetch } = useAgentsList();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "var(--cic-color-success)";
      case "offline":
        return "var(--cic-color-error)";
      case "error":
        return "var(--cic-color-warning)";
      default:
        return "var(--cic-color-text-muted)";
    }
  };

  if (isLoading) {
    return (
      <div className="cic-section">
        <h2 className="cic-section-title">🤖 Agents</h2>
        <p style={{ color: "var(--cic-color-text-secondary)" }}>
          Loading agent data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cic-section">
        <h2 className="cic-section-title">🤖 Agents</h2>
        <p style={{ color: "var(--cic-color-error)" }}>Error loading agents</p>
      </div>
    );
  }

  return (
    <div className="cic-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--cic-space-16)" }}>
        <h2 className="cic-section-title">🤖 Agents</h2>
        <button
          onClick={() => refetch()}
          style={{
            padding: "var(--cic-space-6) var(--cic-space-10)",
            background: "var(--cic-color-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--cic-space-3)",
            cursor: "pointer",
            fontSize: "12px",
            transition: "all 120ms var(--cic-motion-ease)",
          }}
        >
          🔄 Refresh
        </button>
      </div>
      <p className="cic-section-description">
        Live agent status and execution metrics. Auto-updates every 5s.
      </p>

      <div
        style={{
          background: "var(--cic-color-surface)",
          border: "1px solid var(--cic-color-border)",
          borderRadius: "var(--cic-space-4)",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--cic-color-surface-elevation-1)",
                borderBottom: "1px solid var(--cic-color-border)",
              }}
            >
              <th
                style={{
                  padding: "var(--cic-space-12)",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Name
              </th>
              <th
                style={{
                  padding: "var(--cic-space-12)",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "var(--cic-space-12)",
                  textAlign: "right",
                  fontWeight: "600",
                }}
              >
                Executions
              </th>
              <th
                style={{
                  padding: "var(--cic-space-12)",
                  textAlign: "right",
                  fontWeight: "600",
                }}
              >
                Errors
              </th>
            </tr>
          </thead>
          <tbody>
            {agents?.map((agent) => (
              <tr
                key={agent.id}
                style={{
                  borderBottom: "1px solid var(--cic-color-border)",
                }}
              >
                <td style={{ padding: "var(--cic-space-12)" }}>{agent.name}</td>
                <td style={{ padding: "var(--cic-space-12)", textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: getStatusColor(agent.status),
                      marginRight: "var(--cic-space-6)",
                    }}
                  />
                  {agent.status}
                </td>
                <td style={{ padding: "var(--cic-space-12)", textAlign: "right" }}>
                  {agent.executionCount}
                </td>
                <td
                  style={{
                    padding: "var(--cic-space-12)",
                    textAlign: "right",
                    color:
                      agent.errorCount > 0
                        ? "var(--cic-color-warning)"
                        : "var(--cic-color-text)",
                  }}
                >
                  {agent.errorCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Agent Details */}
      <div style={{ marginTop: "var(--cic-space-32)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 var(--cic-space-12) 0" }}>
          Data Polling
        </h3>
        <div
          style={{
            background: "var(--cic-color-surface-elevation-1)",
            border: "1px solid var(--cic-color-border)",
            padding: "var(--cic-space-12)",
            borderRadius: "var(--cic-space-4)",
            fontSize: "12px",
            color: "var(--cic-color-text-secondary)",
          }}
        >
          <p style={{ margin: "0 0 var(--cic-space-6) 0" }}>
            ✅ agents.list — 5s interval
          </p>
          <p style={{ margin: "0 0 var(--cic-space-6) 0" }}>
            ✅ agents.health — 3s interval
          </p>
          <p style={{ margin: "0" }}>
            ✅ WebSocket invalidation — real-time updates
          </p>
        </div>
      </div>
    </div>
  );
}

export default AgentsPanel;
