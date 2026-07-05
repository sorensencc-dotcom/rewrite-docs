import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "../cic/Card";
import { Button } from "../cic/Button";
import { StatusPill } from "./StatusPill";
import { Metric } from "./Metric";
import { SkillsList } from "./SkillsList";
import "./agent-card.css";
const formatTimestamp = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    if (diffSecs < 60)
        return `${diffSecs}s ago`;
    if (diffMins < 60)
        return `${diffMins}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    return date.toLocaleDateString();
};
export const AgentCard = ({ agent, onSelect }) => {
    return (_jsxs(Card, { className: "agent-card", onClick: () => onSelect?.(agent.id), children: [_jsxs("div", { className: "agent-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "agent-card-title", children: agent.name }), _jsxs("div", { className: "agent-card-heartbeat", children: ["Heartbeat: ", formatTimestamp(agent.heartbeat)] })] }), _jsx(StatusPill, { status: agent.status })] }), _jsxs("div", { className: "agent-card-metrics", children: [_jsx(Metric, { label: "Exec (24h)", value: agent.metrics.executions24h }), _jsx(Metric, { label: "Errors (24h)", value: agent.metrics.errors24h }), _jsx(Metric, { label: "Cost (24h)", value: `$${agent.metrics.cost24h.toFixed(2)}` }), _jsx(Metric, { label: "p95 (ms)", value: agent.metrics.latencyP95 })] }), _jsx("div", { className: "agent-card-skills", children: _jsx(SkillsList, { skills: agent.skills }) }), _jsxs("div", { className: "agent-card-actions", children: [_jsx(Button, { variant: "secondary", size: "small", children: "Invoke" }), _jsx(Button, { variant: "ghost", size: "small", children: "Pause" }), _jsx(Button, { variant: "ghost", size: "small", children: "Restart" }), _jsx(Button, { variant: "primary", size: "small", children: "Snapshot" })] })] }));
};
//# sourceMappingURL=AgentCard.js.map