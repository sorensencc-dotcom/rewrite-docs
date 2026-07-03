import React from "react";

const TYPOGRAPHY_TOKENS = [
  { name: "--cic-type-heading-l", label: "Heading L", sample: "Large Heading" },
  { name: "--cic-type-heading-m", label: "Heading M", sample: "Medium Heading" },
  { name: "--cic-type-heading-s", label: "Heading S", sample: "Small Heading" },
  { name: "--cic-type-body-l", label: "Body L", sample: "Large body text" },
  { name: "--cic-type-body-m", label: "Body M", sample: "Medium body text" },
  { name: "--cic-type-body-s", label: "Body S", sample: "Small body text" },
  { name: "--cic-type-mono", label: "Monospace", sample: "const x = 42;" },
];

export function TypographySection() {
  return (
    <div className="cic-section">
      <h2 className="cic-section-title">🔤 Typography</h2>
      <p className="cic-section-description">
        Type scale with consistent line heights and font sizes.
      </p>

      <div style={{ display: "grid", gap: "var(--cic-space-16)" }}>
        {TYPOGRAPHY_TOKENS.map((token) => (
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
                fontSize: "var(" + token.name + ")",
                margin: "0 0 var(--cic-space-8) 0",
              }}
            >
              {token.sample}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--cic-color-text-secondary)" }}>
              <span>{token.label}</span>
              <span style={{ fontFamily: "monospace" }}>{token.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Line Height Examples */}
      <div className="cic-section" style={{ marginTop: "var(--cic-space-32)" }}>
        <h3 className="cic-section-title" style={{ fontSize: "14px" }}>
          Line Height
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "var(--cic-space-16)",
          }}
        >
          <div
            style={{
              background: "var(--cic-color-surface-elevation-1)",
              padding: "var(--cic-space-12)",
              borderRadius: "var(--cic-space-4)",
              border: "1px solid var(--cic-color-border)",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "var(--cic-space-8)" }}>
              Tight (1.2)
            </p>
            <p style={{ lineHeight: "1.2", fontSize: "13px" }}>
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
            </p>
          </div>

          <div
            style={{
              background: "var(--cic-color-surface-elevation-1)",
              padding: "var(--cic-space-12)",
              borderRadius: "var(--cic-space-4)",
              border: "1px solid var(--cic-color-border)",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "var(--cic-space-8)" }}>
              Normal (1.5)
            </p>
            <p style={{ lineHeight: "1.5", fontSize: "13px" }}>
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
            </p>
          </div>

          <div
            style={{
              background: "var(--cic-color-surface-elevation-1)",
              padding: "var(--cic-space-12)",
              borderRadius: "var(--cic-space-4)",
              border: "1px solid var(--cic-color-border)",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "var(--cic-space-8)" }}>
              Relaxed (1.8)
            </p>
            <p style={{ lineHeight: "1.8", fontSize: "13px" }}>
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
            </p>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="cic-section" style={{ marginTop: "var(--cic-space-32)" }}>
        <h3 className="cic-section-title" style={{ fontSize: "14px" }}>
          Accessibility
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
            ✅ Minimum font size: 12px
            ✅ Color contrast: WCAG AA
            ✅ Line height: 1.2–1.8
          </p>
        </div>
      </div>
    </div>
  );
}

export default TypographySection;
