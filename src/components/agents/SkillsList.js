import { jsx as _jsx } from "react/jsx-runtime";
import "./skills-list.css";
export const SkillsList = ({ skills }) => {
    return (_jsx("div", { className: "skills-list", children: skills.map((skill) => (_jsx("span", { className: "skill-badge", children: skill }, skill))) }));
};
//# sourceMappingURL=SkillsList.js.map