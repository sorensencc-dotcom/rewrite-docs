import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Panel } from "../cic/Panel";
import { Grid } from "../cic/Grid";
import { Button } from "../cic/Button";
import { Alert } from "../cic/Alert";
import { AgentCard } from "./AgentCard";
import { useAgentList } from "../../hooks/useAgentList";
import "./agents-panel.css";
export const AgentsPanel = () => {
    const { agents, loading, error, refresh, snapshotAll } = useAgentList({
        poll: true,
        stream: true,
    });
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    const handleSnapshot = async () => {
        setSnapshotLoading(true);
        try {
            await snapshotAll();
            // TODO: Show success toast
        }
        catch {
            // TODO: Show error toast
        }
        finally {
            setSnapshotLoading(false);
        }
    };
    return (_jsxs(Panel, { className: "agents-panel", children: [_jsxs("div", { className: "agents-panel-header", children: [_jsx("h2", { children: "Agents" }), _jsxs("div", { className: "agents-panel-controls", children: [_jsx(Button, { variant: "ghost", size: "medium", onClick: refresh, children: "Refresh" }), _jsx(Button, { variant: "primary", size: "medium", onClick: handleSnapshot, disabled: snapshotLoading, children: "Snapshot All" })] })] }), error && _jsxs(Alert, { className: "alert-error", children: ["Failed to load agents: ", error.message] }), loading && _jsx(Alert, { className: "alert-info", children: "Loading agents\u2026" }), !loading && agents.length === 0 && !error && (_jsx(Alert, { className: "alert-info", children: "No agents found" })), agents.length > 0 && (_jsx(Grid, { cols: 3, children: agents.map((agent) => (_jsx(AgentCard, { agent: agent }, agent.id))) }))] }));
};
//# sourceMappingURL=AgentsPanel.js.map