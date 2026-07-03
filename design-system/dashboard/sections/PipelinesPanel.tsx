import React from "react";
import { usePipelineRuns } from "../hooks";

export function PipelinesPanel() {
  const { data: runs, isLoading } = usePipelineRuns();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "var(--cic-color-info)";
      case "succeeded":
        return "var(--cic-color-success)";
      case "failed":
        return "var(--cic-color-error)";
      case "cancelled":
        return "var(--cic-color-warning)";
      default:
        return "var(--cic-color-text-secondary)";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return "▶";
      case "succeeded":
        return "✓";
      case "failed":
        return "✕";
      case "cancelled":
        return "−";
      default:
        return "?";
    }
  };

  if (isLoading) {
    return (
      <div className="cic-section">
        <h2 className="cic-section-title">⚙️ Pipelines</h2>
        <p style={{ color: "var(--cic-color-text-secondary)" }}>
          Loading pipeline data...
        </p>
      </div>
    );
  }

  return (
    <div className="cic-section">
      <h2 className="cic-section-title">⚙️ Pipelines</h2>
      <p className="cic-section-description">
        Active pipeline runs and task execution status. 5s polling.
      </p>

      <div
        style={{
          display: "grid",
          gap: "var(--cic-space-12)",
        }}
      >
        {runs?.map((run) => (
          <div
            key={run.id}
            style={{
              background: "var(--cic-color-surface-elevation-1)",
              border: `2px solid ${getStatusColor(run.status)}`,
              padding: "var(--cic-space-12)",
              borderRadius: "var(--cic-space-4)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "var(--cic-space-12)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--cic-space-8)",
                    marginBottom: "var(--cic-space-4)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      color: getStatusColor(run.status),
                    }}
                  >
                    {getStatusIcon(run.status)}
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      margin: 0,
                    }}
                  >
                    {run.pipelineName}
                  </p>
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--cic-color-text-secondary)",
                    margin: 0,
                  }}
                >
                  Started: {new Date(run.startTime).toLocaleTimeString()}
                </p>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: getStatusColor(run.status),
                  textTransform: "uppercase",
                }}
              >
                {run.status}
              </span>
            </div>

            {/* Task Progress */}
            <div style={{ marginBottom: "var(--cic-space-12)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "var(--cic-color-text-secondary)",
                  marginBottom: "var(--cic-space-4)",
                }}
              >
                <span>
                  {run.successCount + run.failureCount}/{run.taskCount} tasks
                </span>
                <span>
                  {(
                    ((run.successCount + run.failureCount) / run.taskCount) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  background: "var(--cic-color-surface)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      width: `${(run.successCount / run.taskCount) * 100}%`,
                      background: "var(--cic-color-success)",
                    }}
                  />
                  <div
                    style={{
                      width: `${(run.failureCount / run.taskCount) * 100}%`,
                      background: "var(--cic-color-error)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Duration */}
            <div
              style={{
                fontSize: "11px",
                color: "var(--cic-color-text-secondary)",
              }}
            >
              <p style={{ margin: 0 }}>
                Duration: {(run.duration / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Polling Info */}
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
          <p style={{ margin: 0 }}>
            ✅ pipelines.runs — 5s interval (high-churn)
          </p>
        </div>
      </div>
    </div>
  );
}

export default PipelinesPanel;
