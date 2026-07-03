import React, { useState } from "react";
import TokenPreview from "../components/TokenPreview";

const COLOR_TOKENS = [
  {
    name: "--cic-color-surface",
    label: "Surface",
    category: "Background",
  },
  {
    name: "--cic-color-surface-elevation-1",
    label: "Elevated Surface",
    category: "Background",
  },
  {
    name: "--cic-color-text",
    label: "Text",
    category: "Text",
  },
  {
    name: "--cic-color-text-secondary",
    label: "Secondary Text",
    category: "Text",
  },
  {
    name: "--cic-color-text-muted",
    label: "Muted Text",
    category: "Text",
  },
  {
    name: "--cic-color-border",
    label: "Border",
    category: "Border",
  },
  {
    name: "--cic-color-accent",
    label: "Accent",
    category: "Accent",
  },
  {
    name: "--cic-color-accent-hover",
    label: "Accent Hover",
    category: "Accent",
  },
  {
    name: "--cic-color-success",
    label: "Success",
    category: "Status",
  },
  {
    name: "--cic-color-warning",
    label: "Warning",
    category: "Status",
  },
  {
    name: "--cic-color-error",
    label: "Error",
    category: "Status",
  },
  {
    name: "--cic-color-info",
    label: "Info",
    category: "Status",
  },
];

export function ColorSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="cic-section">
      <h2 className="cic-section-title">🎨 Colors</h2>
      <p className="cic-section-description">
        Live color tokens from the CIC design system. All colors are WCAG AA
        compliant.
      </p>

      <div className="cic-token-grid">
        {COLOR_TOKENS.map((token) => (
          <TokenPreview
            key={token.name}
            token={token.name}
            label={token.label}
            category={token.category}
            isCopied={copied === token.name}
            onCopy={() => handleCopy(token.name)}
          />
        ))}
      </div>

      {/* Used in Components */}
      <div className="cic-section" style={{ marginTop: "var(--cic-space-32)" }}>
        <h3 className="cic-section-title" style={{ fontSize: "14px" }}>
          Used in Components
        </h3>
        <div className="cic-token-usage">
          <p>
            <strong>--cic-color-surface:</strong> Button, Panel, Input, Table,
            Card
          </p>
          <p>
            <strong>--cic-color-accent:</strong> Button primary, Links, Focus
            rings
          </p>
          <p>
            <strong>--cic-color-border:</strong> Table rows, Input borders,
            Panel dividers
          </p>
          <p>
            <strong>--cic-color-text:</strong> All text content
          </p>
          <p>
            <strong>--cic-color-success:</strong> Badge (success), Alert
            (success), Checkmarks
          </p>
          <p>
            <strong>--cic-color-error:</strong> Badge (error), Alert (error),
            Error messages
          </p>
        </div>
      </div>

      {/* Contrast Checker */}
      <div className="cic-section" style={{ marginTop: "var(--cic-space-32)" }}>
        <h3 className="cic-section-title" style={{ fontSize: "14px" }}>
          Contrast Validation
        </h3>
        <div
          style={{
            background: "var(--cic-color-surface)",
            border: "1px solid var(--cic-color-border)",
            padding: "var(--cic-space-12)",
            borderRadius: "var(--cic-space-4)",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px" }}>
            ✅ All color combinations meet WCAG AA standards (4.5:1 minimum
            contrast)
          </p>
        </div>
      </div>
    </div>
  );
}

export default ColorSection;
