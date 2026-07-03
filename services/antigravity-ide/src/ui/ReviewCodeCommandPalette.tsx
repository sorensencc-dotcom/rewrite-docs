import React from 'react';

export function ReviewCodeCommandPalette({
  onReview,
  onShowLastReview,
  onOpenSettings
}: {
  onReview: () => void;
  onShowLastReview: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Gemini Coach — Commands</h2>

      <button onClick={onReview}>Review Current File</button>

      <button onClick={onShowLastReview} style={{ marginTop: 8 }}>
        Show Last Review Summary
      </button>

      <button onClick={onOpenSettings} style={{ marginTop: 8 }}>
        Coach Settings
      </button>
    </div>
  );
}
