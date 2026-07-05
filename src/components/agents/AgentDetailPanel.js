import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Panel } from "../cic/Panel";
import { Tabs } from "../cic/Tabs";
import { Button } from "../cic/Button";
import { Alert } from "../cic/Alert";
import { useAgent } from "../../hooks/useAgent";
import { StatusPill } from "./StatusPill";
import { Metric } from "./Metric";
import { SkillsList } from "./SkillsList";
import "./agent-detail-panel.css";
const formatTimestamp = (iso) => {
    const date = new Date(iso);
    return date.toLocaleString();
};
const formatDuration = (ms) => {
    if (ms < 1000)
        return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};
const OverviewTab = ({ agentId }) => {
    const { agent } = useAgent(agentId, { poll: false, stream: false });
    if (!agent)
        return _jsx(Alert, { children: "Loading agent..." });
    return (_jsxs("div", { className: "agent-detail-tab", children: [_jsx("h4", { children: "Metrics" }), _jsxs("div", { className: "metrics-grid", children: [_jsx(Metric, { label: "Executions (24h)", value: agent.metrics.executions24h }), _jsx(Metric, { label: "Errors (24h)", value: agent.metrics.errors24h }), _jsx(Metric, { label: "Cost (24h)", value: `$${agent.metrics.cost24h.toFixed(2)}` }), _jsx(Metric, { label: "Latency p95", value: `${agent.metrics.latencyP95}ms` })] }), _jsx("h4", { children: "Skills" }), _jsx(SkillsList, { skills: agent.skills }), _jsx("h4", { children: "Configuration" }), _jsxs("div", { className: "config-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "Max Concurrency:" }), _jsx("strong", { children: agent.config.maxConcurrency })] }), _jsxs("div", { children: [_jsx("span", { children: "Warm Pool:" }), _jsx("strong", { children: agent.config.warmPool ? "Enabled" : "Disabled" })] }), _jsxs("div", { children: [_jsx("span", { children: "Version:" }), _jsx("strong", { children: agent.config.version })] })] })] }));
};
const LogsTab = ({ agentId }) => {
    const { logs } = useAgent(agentId);
    if (logs.length === 0) {
        return _jsx(Alert, { children: "No logs yet" });
    }
    return (_jsx("div", { className: "agent-detail-tab", children: _jsx("div", { className: "logs-list", children: logs.map((log, idx) => (_jsxs("div", { className: `log-entry log-entry--${log.level}`, children: [_jsx("span", { className: "log-time", children: formatTimestamp(log.ts) }), _jsx("span", { className: "log-level", children: log.level.toUpperCase() }), log.skill && _jsx("span", { className: "log-skill", children: log.skill }), log.correlationId && _jsx("span", { className: "log-corr", children: log.correlationId }), _jsx("span", { className: "log-message", children: log.message })] }, idx))) }) }));
};
const ExecutionsTab = ({ agentId }) => {
    const { executions } = useAgent(agentId);
    if (executions.length === 0) {
        return _jsx(Alert, { children: "No executions yet" });
    }
    return (_jsx("div", { className: "agent-detail-tab", children: _jsxs("table", { className: "executions-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Skill" }), _jsx("th", { children: "Duration" }), _jsx("th", { children: "Cost" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Started At" })] }) }), _jsx("tbody", { children: executions.map((exec) => (_jsxs("tr", { children: [_jsx("td", { children: exec.id }), _jsx("td", { children: exec.skill }), _jsx("td", { children: formatDuration(exec.durationMs) }), _jsxs("td", { children: ["$", exec.costUsd.toFixed(2)] }), _jsx("td", { className: `status-${exec.status}`, children: exec.status }), _jsx("td", { children: formatTimestamp(exec.startedAt) })] }, exec.id))) })] }) }));
};
const SystemTab = ({ agentId }) => {
    const { agent } = useAgent(agentId, { poll: false, stream: false });
    if (!agent)
        return _jsx(Alert, { children: "Loading agent..." });
    return (_jsx("div", { className: "agent-detail-tab", children: _jsxs("div", { className: "system-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "Version:" }), _jsx("strong", { children: agent.config.version })] }), _jsxs("div", { children: [_jsx("span", { children: "Warm Pool:" }), _jsx("strong", { children: agent.config.warmPool ? "Enabled" : "Disabled" })] }), _jsxs("div", { children: [_jsx("span", { children: "Memory:" }), _jsxs("strong", { children: [agent.system.memoryMB, " MB"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Last Restart:" }), _jsx("strong", { children: formatTimestamp(agent.system.lastRestart) })] }), _jsxs("div", { children: [_jsx("span", { children: "Restart Reason:" }), _jsx("strong", { children: agent.system.restartReason })] })] }) }));
};
export const AgentDetailPanel = ({ agentId }) => {
    const { agent, loading, error, actions } = useAgent(agentId);
    const [invokeLoading, setInvokeLoading] = useState(false);
    const [pauseLoading, setPauseLoading] = useState(false);
    const [restartLoading, setRestartLoading] = useState(false);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    if (loading || !agent) {
        return _jsx(Panel, { children: _jsx(Alert, { children: "Loading agent..." }) });
    }
    if (error || !agent) {
        return _jsx(Panel, { children: _jsx(Alert, { children: "Failed to load agent" }) });
    }
    return (_jsxs(Panel, { className: "agent-detail-panel", children: [_jsx("div", { className: "agent-detail-header", children: _jsxs("div", { children: [_jsx("h2", { children: agent.name }), _jsx(StatusPill, { status: agent.status }), _jsxs("div", { children: ["Heartbeat: ", formatTimestamp(agent.heartbeat)] })] }) }), _jsxs(Tabs, { defaultTab: "overview", children: [_jsx(Tabs.Tab, { id: "overview", label: "Overview", children: _jsx(OverviewTab, { agentId: agentId }) }), _jsx(Tabs.Tab, { id: "logs", label: "Logs", children: _jsx(LogsTab, { agentId: agentId }) }), _jsx(Tabs.Tab, { id: "executions", label: "Executions", children: _jsx(ExecutionsTab, { agentId: agentId }) }), _jsx(Tabs.Tab, { id: "system", label: "System", children: _jsx(SystemTab, { agentId: agentId }) })] }), _jsxs("div", { className: "agent-detail-footer", children: [_jsx(Button, { variant: "primary", onClick: async () => {
                            setInvokeLoading(true);
                            try {
                                await actions.invoke();
                            }
                            finally {
                                setInvokeLoading(false);
                            }
                        }, disabled: invokeLoading, children: "Invoke" }), _jsx(Button, { variant: "ghost", onClick: async () => {
                            setPauseLoading(true);
                            try {
                                await actions.pause();
                            }
                            finally {
                                setPauseLoading(false);
                            }
                        }, disabled: pauseLoading, children: "Pause" }), _jsx(Button, { variant: "ghost", onClick: async () => {
                            setRestartLoading(true);
                            try {
                                await actions.restart();
                            }
                            finally {
                                setRestartLoading(false);
                            }
                        }, disabled: restartLoading, children: "Restart" }), _jsx(Button, { variant: "primary", onClick: async () => {
                            setSnapshotLoading(true);
                            try {
                                await actions.snapshot();
                            }
                            finally {
                                setSnapshotLoading(false);
                            }
                        }, disabled: snapshotLoading, children: "Snapshot" })] })] }));
};
//# sourceMappingURL=AgentDetailPanel.js.map