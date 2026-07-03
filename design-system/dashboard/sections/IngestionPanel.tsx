import React from "react";
import { useIngestionQueue, useIngestionDLQ } from "../hooks";

export function IngestionPanel() {
  const { data: queue, isLoading: queueLoading } = useIngestionQueue();
  const { data: dlqEvents, isLoading: dlqLoading } = useIngestionDLQ();

  if (queueLoading || dlqLoading) {
    return (
      <div className="cic-section">
        <h2 className="cic-section-title">📥 Ingestion</h2>
        <p style={{ color: "var(--cic-color-text-secondary)" }}>
          Loading ingestion data...
        </p>
      </div>
    );
  }

  return (
    <div className="cic-section">
      <h2 className="cic-section-title">📥 Ingestion</h2>
      <p className="cic-section-description">
        Queue depth, throughput, and dead-letter queue monitoring.
      </p>

      {/* Queue Stats */}
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
            Queue Depth
          </p>
          <p style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>
            {queue?.depth.toLocaleString()}
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
            Processed
          </p>
          <p style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>
            {queue?.processed.toLocaleString()}
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
            Avg Latency
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: "600",
              margin: 0,
              color: "var(--cic-color-text)",
            }}
          >
            {queue?.avgLatency.toFixed(0)}ms
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
            Errors
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: "600",
              margin: 0,
              color: queue?.errored ? "var(--cic-color-error)" : "var(--cic-color-success)",
            }}
          >
            {queue?.errored}
          </p>
        </div>
      </div>

      {/* DLQ Events */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 var(--cic-space-12) 0" }}>
          Dead-Letter Queue
        </h3>
        {dlqEvents && dlqEvents.length > 0 ? (
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
                fontSize: "12px",
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
                      padding: "var(--cic-space-10)",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Source
                  </th>
                  <th
                    style={{
                      padding: "var(--cic-space-10)",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Error
                  </th>
                  <th
                    style={{
                      padding: "var(--cic-space-10)",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Retries
                  </th>
                </tr>
              </thead>
              <tbody>
                {dlqEvents.map((event) => (
                  <tr
                    key={event.id}
                    style={{
                      borderBottom: "1px solid var(--cic-color-border)",
                    }}
                  >
                    <td style={{ padding: "var(--cic-space-10)" }}>
                      {event.source}
                    </td>
                    <td
                      style={{
                        padding: "var(--cic-space-10)",
                        color: "var(--cic-color-error)",
                      }}
                    >
                      {event.error}
                    </td>
                    <td
                      style={{
                        padding: "var(--cic-space-10)",
                        textAlign: "center",
                      }}
                    >
                      {event.retries}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--cic-color-text-secondary)" }}>
            No errors in queue
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
            ✅ ingestion.queue — 3s interval
          </p>
          <p style={{ margin: "0" }}>
            ✅ ingestion.dlq — 10s interval
          </p>
        </div>
      </div>
    </div>
  );
}

export default IngestionPanel;
