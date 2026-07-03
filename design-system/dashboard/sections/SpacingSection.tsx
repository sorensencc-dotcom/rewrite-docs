import React from "react";
import TokenPreview from "../components/TokenPreview";

const SPACING_TOKENS = [
  { name: "--cic-space-4", label: "XS (4px)" },
  { name: "--cic-space-8", label: "S (8px)" },
  { name: "--cic-space-12", label: "M (12px)" },
  { name: "--cic-space-16", label: "L (16px)" },
  { name: "--cic-space-20", label: "XL (20px)" },
  { name: "--cic-space-24", label: "2XL (24px)" },
  { name: "--cic-space-32", label: "3XL (32px)" },
];

export function SpacingSection() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="cic-section">
      <h2 className="cic-section-title">📏 Spacing</h2>
      <p className="cic-section-description">
        Consistent spacing scale for padding, margins, and gaps.
      </p>

      <div className="cic-token-grid">
        {SPACING_TOKENS.map((token) => (
          <TokenPreview
            key={token.name}
            token={token.name}
            label={token.label}
            category="Spacing"
            isCopied={copied === token.name}
            onCopy={() => handleCopy(token.name)}
          />
        ))}
      </div>

      {/* Spacing Examples */}
      <div className="cic-section" style={{ marginTop: "var(--cic-space-32)" }}>
        <h3 className="cic-section-title" style={{ fontSize: "14px" }}>
          Spacing Examples
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--cic-space-16)",
          }}
        >
          <div>
            <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0" }}>
              Button Padding
            </p>
            <div
              style={{
                background: "var(--cic-color-accent)",
                padding: "var(--cic-space-12) var(--cic-space-16)",
                borderRadius: "var(--cic-space-4)",
                color: "white",
                width: "fit-content",
              }}
            >
              Example Button
            </div>
          </div>

          <div>
            <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0" }}>
              Panel Padding
            </p>
            <div
              style={{
                background: "var(--cic-color-surface-elevation-1)",
                border: "1px solid var(--cic-color-border)",
                padding: "var(--cic-space-12)",
                borderRadius: "var(--cic-space-4)",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px" }}>Panel content</p>
            </div>
          </div>
        </div>
      </div>

      {/* Density System Preview */}
      <div className="cic-section" style={{ marginTop: "var(--cic-space-32)" }}>
        <h3 className="cic-section-title" style={{ fontSize: "14px" }}>
          Density System
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--cic-space-16)",
          }}
        >
          <div style={{ border: "1px solid var(--cic-color-border)", borderRadius: "var(--cic-space-4)", padding: "var(--cic-space-8)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0" }}>
              Compact
            </p>
            <div style={{ fontSize: "12px", lineHeight: "1.3" }}>
              <div style={{ padding: "var(--cic-space-4)" }}>Row 1</div>
              <div style={{ padding: "var(--cic-space-4)" }}>Row 2</div>
              <div style={{ padding: "var(--cic-space-4)" }}>Row 3</div>
            </div>
          </div>

          <div style={{ border: "1px solid var(--cic-color-border)", borderRadius: "var(--cic-space-4)", padding: "var(--cic-space-8)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0" }}>
              Cozy
            </p>
            <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
              <div style={{ padding: "var(--cic-space-8)" }}>Row 1</div>
              <div style={{ padding: "var(--cic-space-8)" }}>Row 2</div>
              <div style={{ padding: "var(--cic-space-8)" }}>Row 3</div>
            </div>
          </div>

          <div style={{ border: "1px solid var(--cic-color-border)", borderRadius: "var(--cic-space-4)", padding: "var(--cic-space-8)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 var(--cic-space-8) 0" }}>
              Comfortable
            </p>
            <div style={{ fontSize: "12px", lineHeight: "1.8" }}>
              <div style={{ padding: "var(--cic-space-12)" }}>Row 1</div>
              <div style={{ padding: "var(--cic-space-12)" }}>Row 2</div>
              <div style={{ padding: "var(--cic-space-12)" }}>Row 3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpacingSection;
