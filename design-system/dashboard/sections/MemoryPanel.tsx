import React from "react";
import { useMemoryClusters } from "../hooks";

export function MemoryPanel() {
  const { data: clusters, isLoading } = useMemoryClusters();

  if (isLoading) {
    return (
      <div className="cic-section">
        <h2 className="cic-section-title">🧠 Memory Clusters</h2>
        <p style={{ color: "var(--cic-color-text-secondary)" }}>
          Loading memory data...
        </p>
      </div>
    );
  }

  return (
    <div className="cic-section">
      <h2 className="cic-section-title">🧠 Memory Clusters</h2>
      <p className="cic-section-description">
        Vector database clusters and embedding density metrics. 10s polling.
      </p>

      <div
        style={{
          display: "grid",
          gap: "var(--cic-space-12)",
        }}
      >
        {clusters?.map((cluster) => (
          <div
            key={cluster.id}
            style={{
              background: "var(--cic-color-surface-elevation-1)",
              border: "1px solid var(--cic-color-border)",
              padding: "var(--cic-space-12)",
              borderRadius: "var(--cic-space-4)",
            }}
          >
            <div style={{ marginBottom: "var(--cic-space-12)" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  margin: "0 0 var(--cic-space-4) 0",
                }}
              >
                {cluster.name}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--cic-color-text-secondary)",
                  margin: 0,
                }}
              >
                Updated: {new Date(cluster.lastUpdated).toLocaleTimeString()}
              </p>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "var(--cic-space-8)",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--cic-color-text-secondary)",
                    margin: "0 0 var(--cic-space-4) 0",
                    textTransform: "uppercase",
                  }}
                >
                  Size
                </p>
                <p style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
                  {cluster.size.toFixed(1)} MB
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--cic-color-text-secondary)",
                    margin: "0 0 var(--cic-space-4) 0",
                    textTransform: "uppercase",
                  }}
                >
                  Density
                </p>
                <p style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
                  {(cluster.density * 100).toFixed(0)}%
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--cic-color-text-secondary)",
                    margin: "0 0 var(--cic-space-4) 0",
                    textTransform: "uppercase",
                  }}
                >
                  Vectors
                </p>
                <p style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
                  {cluster.vectorCount}
                </p>
              </div>
            </div>

            {/* Density Bar */}
            <div style={{ marginTop: "var(--cic-space-12)" }}>
              <div
                style={{
                  height: "4px",
                  background: "var(--cic-color-surface)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${cluster.density * 100}%`,
                    background:
                      cluster.density > 0.8
                        ? "var(--cic-color-success)"
                        : cluster.density > 0.6
                          ? "var(--cic-color-warning)"
                          : "var(--cic-color-info)",
                    transition: "width 200ms var(--cic-motion-ease)",
                  }}
                />
              </div>
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
            ✅ memory.clusters — 10s interval (slower changes)
          </p>
        </div>
      </div>
    </div>
  );
}

export default MemoryPanel;
