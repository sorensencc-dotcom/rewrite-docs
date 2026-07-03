import React from 'react';

export function RejectAnimation() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        animation: "rejectShake 0.4s ease-out forwards",
        pointerEvents: "none"
      }}
    />
  );
}
