import React from "react";
import { useDriftEvents, useDriftStats } from "../hooks";

export function DriftPanel() {
  const { data: events, isLoading: eventsLoading } = useDriftEvents();
  const { data: stats, isLoading: statsLoading } = useDriftStats();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "var(--cic-color-error)";
      case "medium":
        return "var(--cic-color-warning)";
      case "low":
        return "var(--cic-color-info)";
      default:
        return "var(--cic-color-text-secondary)";
    }
  };

  if (eventsLoading || statsLoading) {
    return (
      <div className="cic-section">
        <h2 className="cic-section-title">🔍 Drift Detection</h2>
        <p style={{ color: "var(--cic-color-text-secondary)" }}>
          Loading drift data...
        </p>
      </div>
    );
  }

  return (
    <div className="cic-section">
      <h2 className="cic-section-title">🔍 Drift Detection</h2>
      <p className="cic-section-description">
        Design token changes and component drift events. 2s polling.
      </p>

      {/* Drift Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--cic-space-12)",
          marginBottom: "var(--cic-space-32)",
        }}
      >
        <div
          style={{
            background: "var(--cic-color-surface-elevation-1)",
            border: "1px solid var(--cic-color-border)",
            padding: "var(--cic-space-12)",
            borderRadius: "var(--cic-space-4)",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "var(--cic-color-text-secondary)",
              margin: "0 0 var(--cic-space-4) 0",
            }}
          >
            Total Events
          </p>
          <p style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>
            {stats?.totalEvents}
          </p>
        </div>

        <div
          style={{
            background: "var(--cic-color-surface-elevation-1)",
            border: "1px solid var(--cic-color-border)",
            padding: "var(--cic-space-12)",
            borderRadius: "var(--cic-space-4)",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "var(--cic-color-text-secondary)",
              margin: "0 0 var(--cic-space-4) 0",
            }}
          >
            Critical Tokens
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: "600",
              margin: 0,
              color:
                stats?.criticalTokens ? "var(--cic-color-error)" : "var(--cic-color-success)",
            }}
          >
            {stats?.criticalTokens}
          </p>
        </div>

        <div
          style={{
            background: "var(--cic-color-surface-elevation-1)",
            border: "1px solid var(--cic-color-border)",
            padding: "var(--cic-space-12)",
            borderRadius: "var(--cic-space-4)",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "var(--cic-color-text-secondary)",
              margin: "0 0 var(--cic-space-4) 0",
            }}
          >
            Affected Components
          </p>
          <p style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>
            {stats?.affectedComponents}
          </p>
        </div>

        <div
          style={{
            background: "var(--cic-color-surface-elevation-1)",
            border: "1px solid var(--cic-color-border)",
            padding: "var(--cic-space-12)",
            borderRadius: "var(--cic-space-4)",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "var(--cic-color-text-secondary)",
              margin: "0 0 var(--cic-space-4) 0",
            }}
          >
            Hourly Rate
          </p>
          <p style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>
            {stats?.hourlyEventRate.toFixed(1)}/hr
          </p>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 var(--cic-space-12) 0" }}>
          Recent Drift Events
        </h3>
        {events && events.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "var(--cic-space-12)",
            }}
          >
            {events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                style={{
                  background: "var(--cic-color-surface-elevation-1)",
                  border: `2px solid ${getSeverityColor(event.severity)}`,
                  padding: "var(--cic-space-12)",
                  borderRadius: "var(--cic-space-4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "var(--cic-space-8)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        margin: 0,
                      }}
                    >
                      {event.component} → {event.tokenChanged}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--cic-color-text-secondary)",
                        margin: "var(--cic-space-4) 0 0 0",
                      }}
                    >
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: getSeverityColor(event.severity),
                      textTransform: "uppercase",
                    }}
                  >
                    {event.severity}
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--cic-color-surface)",
                    padding: "var(--cic-space-8)",
                    borderRadius: "var(--cic-space-3)",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                >
                  <p style={{ margin: "0 0 var(--cic-space-4) 0" }}>
                    <span style={{ color: "var(--cic-color-error)" }}>−</span>{" "}
                    {event.oldValue}
                  </p>
                  <p style={{ margin: 0 }}>
                    <span style={{ color: "var(--cic-color-success)" }}>+</span>{" "}
                    {event.newValue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--cic-color-text-secondary)" }}>
            No drift events detected
          </p>
        )}
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
          <p style={{ margin: "0 0 var(--cic-space-6) 0" }}>
            ✅ drift.events — 2s interval (time-sensitive)
          </p>
          <p style={{ margin: "0" }}>
            ✅ drift.stats — 5s interval
          </p>
        </div>
      </div>
    </div>
  );
}

export default DriftPanel;
