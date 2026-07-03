import React from 'react';

export function DriftTimeline({
  data
}: {
  data: { timestamp: string; drift: number; contributors: string[] }[];
}) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Drift Timeline</h2>

      <svg width="100%" height="200">
        {data.map((point, i) => {
          const x = (i / (data.length - 1)) * 800;
          const y = 180 - point.drift * 180;

          return (
            <circle key={i} cx={x} cy={y} r={4} fill="orange">
              <title>
                {point.timestamp}
                {"\n"}Drift: {point.drift.toFixed(2)}
                {"\n"}Contributors: {point.contributors.join(", ")}
              </title>
            </circle>
          );
        })}
      </svg>

      <ul>
        {data.map((p, i) => (
          <li key={i}>
            <strong>{p.timestamp}</strong> — Drift {p.drift.toFixed(2)}  
            <br />
            Contributors: {p.contributors.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
