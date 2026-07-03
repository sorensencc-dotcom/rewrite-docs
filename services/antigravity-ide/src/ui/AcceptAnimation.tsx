import React from 'react';

export function AcceptAnimation() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,255,0,0.15)",
        animation: "acceptFlash 0.6s ease-out forwards",
        pointerEvents: "none"
      }}
    />
  );
}
