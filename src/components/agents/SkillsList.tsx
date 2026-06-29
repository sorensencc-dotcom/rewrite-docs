import React from "react";
import "./skills-list.css";

export interface SkillsListProps {
  skills: string[];
}

export const SkillsList: React.FC<SkillsListProps> = ({ skills }) => {
  return (
    <div className="skills-list">
      {skills.map((skill) => (
        <span key={skill} className="skill-badge">
          {skill}
        </span>
      ))}
    </div>
  );
};
