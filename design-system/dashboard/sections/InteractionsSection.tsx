import React, { useState } from "react";

const INTERACTION_TOKENS = [
  {
    name: "--cic-motion-ease",
    label: "Easing",
    value: "ease",
    description: "Standard easing for animations",
  },
  {
    name: "--cic-motion-duration-fast",
    label: "Duration (Fast)",
    value: "120ms",
    description: "Quick interactions (hover, focus)",
  },
  {
    name: "--cic-motion-duration-normal",
    label: "Duration (Normal)",
    value: "200ms",
    description: "Standard transitions",
  },
  {
    name: "--cic-motion-duration-slow",
    label: "Duration (Slow)",
    value: "300ms",
    description: "Deliberate animations (modals, drawers)",
  },
];

export function InteractionsSection() {
  const [hoveredState, setHoveredState] = useState<
    "default" | "hover" | "pressed" | "focused"
  >("default");

  return (
    <div className="cic-section">
      <h2 className="cic-section-title">🖱️ Interactions</h2>
      <p className="cic-section-description">
        Motion curves, durations, and focus states.
      </p>

      {/* Motion Tokens */}
      <div style={{ marginBottom: "var(--cic-space-32)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 var(--cic-space-16) 0" }}>
          Motion Tokens
        </h3>
        <div className="cic-token-grid">
          {INTERACTION_TOKENS.map((token) => (
            <div
              key={token.name}
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
                  fontWeight: "600",
                  margin: "0 0 var(--cic-space-4) 0",
                  fontFamily: "monospace",
                }}
              >
                {token.name}
              </p>
              <p style={{ fontSize: "13px", fontWeight: "500", margin: "0 0 var(--cic-space-4) 0" }}>
                {token.label}
              </p>
              <p style={{ fontSize: "12px", color: "var(--cic-color-text-secondary)", margin: "0 0 var(--cic-space-8) 0" }}>
                {token.description}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  background: "var(--cic-color-surface)",
                  padding: "var(--cic-space-4) var(--cic-space-6)",
                  borderRadius: "var(--cic-space-2)",
                  margin: 0,
                  fontFamily: "monospace",
                }}
              >
                {token.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive States */}
      <div style={{ marginBottom: "var(--cic-space-32)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 var(--cic-space-16) 0" }}>
          Interactive States
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--cic-space-16)" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "var(--cic-space-8)" }}>
              Button States
            </p>
            <div style={{ display: "grid", gap: "var(--cic-space-8)" }}>
              <button
                style={{
                  padding: "var(--cic-space-10) var(--cic-space-16)",
                  background: "var(--cic-color-accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--cic-space-4)",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Default
              </button>

              <button
                style={{
                  padding: "var(--cic-space-10) var(--cic-space-16)",
                  background: "var(--cic-color-surface)",
                  color: "var(--cic-color-text)",
                  border: "2px solid var(--cic-color-accent)",
                  borderRadius: "var(--cic-space-4)",
                  cursor: "pointer",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                Focused
              </button>

              <button
                style={{
                  padding: "var(--cic-space-10) var(--cic-space-16)",
                  background: "var(--cic-color-surface-elevation-1)",
                  color: "var(--cic-color-text-muted)",
                  border: "none",
                  borderRadius: "var(--cic-space-4)",
                  cursor: "not-allowed",
                  fontSize: "13px",
                  opacity: 0.5,
                }}
                disabled
              >
                Disabled
              </button>
            </div>
          </div>

          <div>
            <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "var(--cic-space-8)" }}>
              Focus Ring Examples
            </p>
            <div style={{ display: "grid", gap: "var(--cic-space-8)" }}>
              <input
                type="text"
                placeholder="Click to focus"
                style={{
                  padding: "var(--cic-space-8) var(--cic-space-10)",
                  border: "1px solid var(--cic-color-border)",
                  borderRadius: "var(--cic-space-4)",
                  background: "var(--cic-color-surface)",
                  color: "var(--cic-color-text)",
                  fontSize: "13px",
                }}
              />

              <div
                style={{
                  padding: "var(--cic-space-8)",
                  background: "var(--cic-color-surface-elevation-1)",
                  border: "1px solid var(--cic-color-border)",
                  borderRadius: "var(--cic-space-4)",
                  outline: "2px solid var(--cic-color-accent)",
                  outlineOffset: "2px",
                }}
              >
                Focused element
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motion Playground */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 var(--cic-space-16) 0" }}>
          Motion Playground
        </h3>
        <div
          style={{
            background: "var(--cic-color-surface-elevation-1)",
            border: "1px solid var(--cic-color-border)",
            padding: "var(--cic-space-16)",
            borderRadius: "var(--cic-space-4)",
          }}
        >
          <div style={{ marginBottom: "var(--cic-space-16)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0" }}>
              State Buttons
            </p>
            <div style={{ display: "flex", gap: "var(--cic-space-8)" }}>
              {(["default", "hover", "pressed", "focused"] as const).map((state) => (
                <button
                  key={state}
                  onClick={() => setHoveredState(state)}
                  style={{
                    padding: "var(--cic-space-6) var(--cic-space-10)",
                    background:
                      hoveredState === state
                        ? "var(--cic-color-accent)"
                        : "var(--cic-color-surface)",
                    color:
                      hoveredState === state ? "white" : "var(--cic-color-text)",
                    border: "1px solid var(--cic-color-border)",
                    borderRadius: "var(--cic-space-3)",
                    cursor: "pointer",
                    fontSize: "12px",
                    transition: "all 120ms var(--cic-motion-ease)",
                  }}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "var(--cic-space-16)",
              background: "var(--cic-color-surface)",
              borderRadius: "var(--cic-space-4)",
              border: "1px solid var(--cic-color-border)",
              textAlign: "center",
              transition: "all var(--cic-motion-duration-fast) var(--cic-motion-ease)",
              transform:
                hoveredState === "pressed" ? "scale(0.95)" : "scale(1)",
              opacity:
                hoveredState === "default" ? 1 : 0.8,
            }}
          >
            <p style={{ margin: 0, fontSize: "13px" }}>
              State: <strong>{hoveredState}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractionsSection;
