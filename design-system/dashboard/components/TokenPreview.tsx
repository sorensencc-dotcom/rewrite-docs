import React from "react";

interface TokenPreviewProps {
  token: string;
  label: string;
  category: string;
  isCopied?: boolean;
  onCopy: () => void;
}

export function TokenPreview({
  token,
  label,
  category,
  isCopied = false,
  onCopy,
}: TokenPreviewProps) {
  // Get computed value from CSS variable
  const getComputedValue = () => {
    try {
      const value = getComputedStyle(document.documentElement).getPropertyValue(
        token
      );
      return value.trim() || "N/A";
    } catch {
      return "N/A";
    }
  };

  const computedValue = getComputedValue();

  return (
    <div className="cic-token-preview" data-category={category}>
      {/* Swatch for Color Tokens */}
      {token.includes("color") && (
        <div
          className="cic-token-swatch"
          style={{ background: `var(${token})` }}
          title={token}
        />
      )}

      {/* Swatch for Spacing Tokens */}
      {token.includes("space") && (
        <div
          className="cic-token-swatch"
          style={{
            background: "var(--cic-color-accent)",
            height: `var(${token})`,
            minHeight: "20px",
          }}
          title={token}
        />
      )}

      {/* Token Name */}
      <p className="cic-token-name">{token}</p>

      {/* Token Label */}
      <p style={{ fontSize: "13px", margin: "var(--cic-space-4) 0" }}>
        {label}
      </p>

      {/* Computed Value */}
      <p className="cic-token-value">{computedValue}</p>

      {/* Copy Button */}
      <button
        className="cic-token-copy"
        onClick={onCopy}
        title={isCopied ? "Copied!" : "Copy to clipboard"}
      >
        {isCopied ? "✓ Copied" : "📋 Copy"}
      </button>

      {/* Component Usage Badge */}
      <div
        style={{
          marginTop: "var(--cic-space-8)",
          fontSize: "11px",
          background: "var(--cic-color-surface-elevation-1)",
          padding: "var(--cic-space-4) var(--cic-space-6)",
          borderRadius: "var(--cic-space-2)",
          textAlign: "center",
          color: "var(--cic-color-text-secondary)",
        }}
      >
        {category}
      </div>
    </div>
  );
}

export default TokenPreview;
