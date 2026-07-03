import React from 'react';

export function SkillOpportunities({
  skills
}: {
  skills: { name: string; stability: number; description: string }[];
}) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Skill Opportunities</h2>

      {skills.length === 0 && <p>No emerging skills detected.</p>}

      {skills.map(skill => (
        <div key={skill.name} style={{ marginBottom: 20 }}>
          <h3>{skill.name}</h3>
          <p><strong>Stability:</strong> {(skill.stability * 100).toFixed(1)}%</p>
          <p>{skill.description}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}
