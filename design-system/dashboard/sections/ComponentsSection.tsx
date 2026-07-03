import React, { useState } from "react";

const COMPONENTS = [
  { name: "Button", variants: ["default", "hover", "disabled", "loading"] },
  { name: "Input", variants: ["default", "focus", "filled", "disabled"] },
  { name: "Table", variants: ["default", "zebra", "compact", "sorting"] },
  { name: "Panel", variants: ["default", "elevated", "collapsed", "with-header"] },
  { name: "Alert", variants: ["info", "success", "warning", "error"] },
  { name: "Badge", variants: ["default", "accent", "success", "error"] },
  { name: "Stat", variants: ["default", "with-trend", "large", "minimal"] },
  { name: "Pill", variants: ["default", "closable", "icon", "avatar"] },
];

export function ComponentsSection() {
  const [selectedComponent, setSelectedComponent] = useState("Button");
  const [selectedVariant, setSelectedVariant] = useState("default");

  const component = COMPONENTS.find((c) => c.name === selectedComponent);

  return (
    <div className="cic-section">
      <h2 className="cic-section-title">🧩 Components</h2>
      <p className="cic-section-description">
        All CIC components, generated via `cic-ui add &lt;component&gt;`.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "var(--cic-space-24)" }}>
        {/* Component List */}
        <div>
          <h3 style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0", textTransform: "uppercase" }}>
            Components
          </h3>
          <div style={{ display: "grid", gap: "var(--cic-space-4)" }}>
            {COMPONENTS.map((comp) => (
              <button
                key={comp.name}
                onClick={() => {
                  setSelectedComponent(comp.name);
                  setSelectedVariant(comp.variants[0]);
                }}
                style={{
                  padding: "var(--cic-space-8) var(--cic-space-10)",
                  background:
                    selectedComponent === comp.name
                      ? "var(--cic-color-accent)"
                      : "transparent",
                  color:
                    selectedComponent === comp.name
                      ? "white"
                      : "var(--cic-color-text)",
                  border: "1px solid var(--cic-color-border)",
                  borderRadius: "var(--cic-space-4)",
                  cursor: "pointer",
                  fontSize: "13px",
                  textAlign: "left",
                  transition: "all 120ms var(--cic-motion-ease)",
                }}
              >
                {comp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Component Preview */}
        <div>
          <div style={{ marginBottom: "var(--cic-space-16)" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0", textTransform: "uppercase" }}>
              Variants
            </h3>
            <div style={{ display: "flex", gap: "var(--cic-space-8)", flexWrap: "wrap" }}>
              {component?.variants.map((variant) => (
                <button
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                  style={{
                    padding: "var(--cic-space-6) var(--cic-space-10)",
                    background:
                      selectedVariant === variant
                        ? "var(--cic-color-accent)"
                        : "var(--cic-color-surface-elevation-1)",
                    color:
                      selectedVariant === variant
                        ? "white"
                        : "var(--cic-color-text)",
                    border: "1px solid var(--cic-color-border)",
                    borderRadius: "var(--cic-space-3)",
                    cursor: "pointer",
                    fontSize: "12px",
                    transition: "all 120ms var(--cic-motion-ease)",
                  }}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Box */}
          <div
            style={{
              background: "var(--cic-color-surface-elevation-1)",
              border: "1px solid var(--cic-color-border)",
              borderRadius: "var(--cic-space-4)",
              padding: "var(--cic-space-24)",
              minHeight: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "var(--cic-space-16)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "var(--cic-color-text-secondary)", margin: "0 0 var(--cic-space-8) 0" }}>
                Preview: {selectedComponent} ({selectedVariant})
              </p>
              <p style={{ fontSize: "12px", color: "var(--cic-color-text-muted)" }}>
                Component preview would render here
              </p>
              <p style={{ fontSize: "11px", color: "var(--cic-color-text-muted)", margin: "var(--cic-space-12) 0 0 0" }}>
                View in Storybook: <code>/story/cic-{selectedComponent.toLowerCase()}--{selectedVariant}</code>
              </p>
            </div>
          </div>

          {/* Token Usage */}
          <div>
            <h3 style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0", textTransform: "uppercase" }}>
              Token Usage
            </h3>
            <div
              style={{
                background: "var(--cic-color-surface)",
                border: "1px solid var(--cic-color-border)",
                borderRadius: "var(--cic-space-4)",
                padding: "var(--cic-space-12)",
                fontFamily: "monospace",
                fontSize: "11px",
                color: "var(--cic-color-text-secondary)",
              }}
            >
              <p style={{ margin: "0 0 var(--cic-space-6) 0" }}>--cic-color-surface</p>
              <p style={{ margin: "0 0 var(--cic-space-6) 0" }}>--cic-color-border</p>
              <p style={{ margin: "0 0 var(--cic-space-6) 0" }}>--cic-space-12</p>
              <p style={{ margin: "0 0 var(--cic-space-6) 0" }}>--cic-space-4</p>
              <p style={{ margin: "0 0 var(--cic-space-6) 0" }}>--cic-color-text</p>
              <p style={{ margin: "0" }}>--cic-motion-ease</p>
            </div>

            <p style={{ fontSize: "11px", color: "var(--cic-color-text-secondary)", margin: "var(--cic-space-8) 0 0 0" }}>
              📄 Full token map: <code>docs/tokens/usage/{selectedComponent}.md</code>
            </p>
          </div>
        </div>
      </div>

      {/* Generated Files Info */}
      <div style={{ marginTop: "var(--cic-space-32)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 var(--cic-space-12) 0" }}>
          Generated Files
        </h3>
        <div
          style={{
            background: "var(--cic-color-surface)",
            border: "1px solid var(--cic-color-border)",
            borderRadius: "var(--cic-space-4)",
            padding: "var(--cic-space-12)",
          }}
        >
          <p style={{ fontSize: "12px", margin: "0 0 var(--cic-space-6) 0" }}>
            ✅ <code>src/components/cic/{selectedComponent}.tsx</code>
          </p>
          <p style={{ fontSize: "12px", margin: "0 0 var(--cic-space-6) 0" }}>
            ✅ <code>src/components/cic/{selectedComponent.toLowerCase()}.css</code>
          </p>
          <p style={{ fontSize: "12px", margin: "0 0 var(--cic-space-6) 0" }}>
            ✅ <code>src/stories/cic/{selectedComponent}.stories.tsx</code>
          </p>
          <p style={{ fontSize: "12px", margin: "0 0 var(--cic-space-6) 0" }}>
            ✅ <code>src/tests/cic/{selectedComponent}.test.tsx</code>
          </p>
          <p style={{ fontSize: "12px", margin: "0 0 var(--cic-space-6) 0" }}>
            ✅ <code>src/visual/cic/{selectedComponent}.spec.ts</code>
          </p>
          <p style={{ fontSize: "12px", margin: "0" }}>
            ✅ <code>docs/tokens/usage/{selectedComponent}.md</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ComponentsSection;
