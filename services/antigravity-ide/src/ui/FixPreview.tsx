import React from 'react';

export function FixPreview({
  original,
  patched,
  onAccept,
  onReject
}: {
  original: string;
  patched: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Fix Preview</h2>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h3>Original</h3>
          <pre>{original}</pre>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Patched</h3>
          <pre>{patched}</pre>
        </div>
      </div>

      <button onClick={onAccept}>Apply Fix</button>
      <button onClick={onReject} style={{ marginLeft: 8 }}>
        Cancel
      </button>
    </div>
  );
}
