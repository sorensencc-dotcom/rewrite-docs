import React from 'react';

export function PatchConfidenceMeter({
  confidence
}: {
  confidence: number; // 0–1
}) {
  const pct = (confidence * 100).toFixed(1);
  const color =
    confidence > 0.8 ? "#4CAF50" :
    confidence > 0.5 ? "#FFC107" :
    "#F44336";

  return (
    <div style={{ padding: 16 }}>
      <h3>Patch Confidence</h3>
      <div style={{ width: "100%", height: 12, background: "#333" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            transition: "width 0.2s ease-out"
          }}
        />
      </div>
      <p>{pct}%</p>
    </div>
  );
}
