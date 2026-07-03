import React from 'react';

export function SkillEvolutionTimeline({
  points
}: {
  points: { timestamp: string; stability: number; name: string }[];
}) {
  return (
    <svg width="100%" height="200" style={{ background: "#111" }}>
      {points.map((p, i) => {
        const x = (i / (points.length - 1)) * 800;
        const y = 180 - p.stability * 180;

        return (
          <circle key={i} cx={x} cy={y} r={4} fill="#4CAF50">
            <title>
              {p.timestamp}
              {"\n"}Skill: {p.name}
              {"\n"}Stability: {(p.stability * 100).toFixed(1)}%
            </title>
          </circle>
        );
      })}
    </svg>
  );
}
