import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Phase 3.6: Operator Console v3 Root Component
 * Integrates accessibility (keyboard, live regions, focus order) with 6-panel dashboard
 * Polling → announcements wiring + keyboard controls
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ConsoleLiveRegions, useConsoleAnnouncements, PollingAnnouncements, } from './live-regions';
import { installKeyboardHook } from './keyboard-shortcuts';
import { useConsolePolling } from './useConsoleAPI';
import { CostComputePanel } from '../../components/CostComputePanel';
const HealthPanel = React.forwardRef(({ onRefresh, status = 'OK', serviceCount = 0 }, ref) => (_jsxs("div", { ref: ref, role: "region", "aria-labelledby": "health-title", tabIndex: 0, className: "panel health-panel", children: [_jsx("h2", { id: "health-title", children: "Health" }), _jsxs("div", { children: ["Status: ", status] }), _jsxs("div", { children: ["Services: ", serviceCount] }), _jsx("button", { type: "button", onClick: onRefresh, children: "Refresh" })] })));
HealthPanel.displayName = 'HealthPanel';
const PipelinesPanel = React.forwardRef(({ onRefresh, pipelineCount = 0 }, ref) => (_jsxs("div", { ref: ref, role: "region", "aria-labelledby": "pipelines-title", tabIndex: 0, className: "panel pipelines-panel", children: [_jsx("h2", { id: "pipelines-title", children: "Pipelines" }), _jsxs("div", { children: [pipelineCount, " active pipelines"] }), _jsx("button", { type: "button", onClick: onRefresh, children: "Refresh" })] })));
PipelinesPanel.displayName = 'PipelinesPanel';
const AgentsPanel = React.forwardRef(({ onRefresh }, ref) => (_jsxs("div", { ref: ref, role: "region", "aria-labelledby": "agents-title", tabIndex: 0, className: "panel agents-panel", children: [_jsx("h2", { id: "agents-title", children: "Agents" }), _jsx("div", { children: "0 agents online" }), _jsx("button", { type: "button", onClick: onRefresh, children: "Refresh" })] })));
AgentsPanel.displayName = 'AgentsPanel';
const AlertsPanel = React.forwardRef(({ onRefresh, alertCount = 0 }, ref) => (_jsxs("div", { ref: ref, role: "region", "aria-labelledby": "alerts-title", tabIndex: 0, className: "panel alerts-panel", children: [_jsx("h2", { id: "alerts-title", children: "Alerts" }), _jsxs("div", { children: [alertCount, " active alerts"] }), _jsx("button", { type: "button", onClick: onRefresh, children: "Refresh" })] })));
AlertsPanel.displayName = 'AlertsPanel';
const WorkspacePanel = React.forwardRef(({ onRefresh }, ref) => (_jsxs("div", { ref: ref, role: "region", "aria-labelledby": "workspace-title", tabIndex: 0, className: "panel workspace-panel", children: [_jsx("h2", { id: "workspace-title", children: "Workspace" }), _jsx("div", { children: "User: operator" }), _jsx("button", { type: "button", onClick: onRefresh, children: "Refresh" })] })));
WorkspacePanel.displayName = 'WorkspacePanel';
const ControlsPanel = () => (_jsxs("div", { role: "region", "aria-labelledby": "controls-title", className: "panel controls-panel", children: [_jsx("h2", { id: "controls-title", children: "Controls" }), _jsx("div", { children: "Ctrl+R: Refresh Health | Ctrl+Shift+R: Refresh All | P+N: Pause Pipeline | [ / ]: Navigate" })] }));
/**
 * ConsoleV3: Main root component
 * Layout: Tier 1 (60/40), Tier 2 (33/33/33), Tier 3 (100%)
 * Integrates Phase 3.6 accessibility + polling + announcements
 */
export const ConsoleV3 = () => {
    const consoleRef = useRef(null);
    const { statusRef, alertRef, logRef, announce } = useConsoleAnnouncements();
    // API polling
    const { health: healthData, pipelines: pipelinesData, alerts: alertsData, start: startPolling } = useConsolePolling({
        health: 10000,
        pipelines: 5000,
        alerts: 3000,
    });
    // Track previous state for announcements
    const [previousHealthStatus, setPreviousHealthStatus] = useState(null);
    const [previousPipelines, setPreviousPipelines] = useState(new Map());
    const [previousAlerts, setPreviousAlerts] = useState([]);
    // Panel ref for focus navigation
    const panelRefs = useRef([]);
    const [focusedPanelIndex, setFocusedPanelIndex] = useState(0);
    // Setup polling on mount
    useEffect(() => {
        const cleanup = startPolling();
        return cleanup;
    }, [startPolling]);
    // Announce health changes
    useEffect(() => {
        if (!healthData)
            return;
        const announcement = PollingAnnouncements.formatHealthAnnouncement({ status: healthData.status, serviceCount: healthData.serviceCount, timestamp: healthData.timestamp }, previousHealthStatus);
        if (announcement) {
            announce(announcement);
        }
        setPreviousHealthStatus(healthData);
    }, [healthData, announce, previousHealthStatus]);
    // Announce pipeline changes
    useEffect(() => {
        if (!pipelinesData || pipelinesData.length === 0)
            return;
        const previousMap = new Map(previousPipelines);
        const announcements = PollingAnnouncements.formatPipelineAnnouncement(pipelinesData.map((p) => ({ id: p.id, state: p.state })), previousMap);
        announcements.forEach((a) => announce(a));
        const newMap = new Map(pipelinesData.map((p) => [p.id, p.state]));
        setPreviousPipelines(newMap);
    }, [pipelinesData, announce, previousPipelines]);
    // Announce alert changes
    useEffect(() => {
        if (!alertsData || alertsData.length === 0)
            return;
        const announcement = PollingAnnouncements.formatAlertAnnouncement(alertsData, previousAlerts);
        if (announcement) {
            announce(announcement);
        }
        setPreviousAlerts(alertsData);
    }, [alertsData, announce, previousAlerts]);
    // Keyboard shortcuts handler
    const handleKeyboardAction = useCallback({
        onRefresh: (target) => {
            if (target === 'health') {
                announce({ type: 'status', message: 'Health panel refreshed' });
            }
            else if (target === 'all') {
                announce({ type: 'status', message: 'All panels refreshed' });
            }
        },
        onPipeline: (action, pipelineNumber) => {
            announce({
                type: 'log',
                message: `Pipeline ${pipelineNumber} ${action}`,
            });
        },
        onAcknowledge: () => {
            announce({ type: 'status', message: 'Alert acknowledged' });
        },
        onFocusSearch: () => {
            announce({ type: 'status', message: 'Search input focused' });
        },
        onNavigatePanel: (direction) => {
            let nextIndex = focusedPanelIndex;
            if (direction === 'next') {
                nextIndex = (focusedPanelIndex + 1) % panelRefs.current.length;
            }
            else if (direction === 'prev') {
                nextIndex = (focusedPanelIndex - 1 + panelRefs.current.length) % panelRefs.current.length;
            }
            setFocusedPanelIndex(nextIndex);
            panelRefs.current[nextIndex]?.focus();
            announce({
                type: 'status',
                message: `Focused panel ${nextIndex + 1}`,
            });
        },
    }, [focusedPanelIndex, announce]);
    // Install keyboard hook on mount
    useEffect(() => {
        if (!consoleRef.current)
            return;
        const cleanup = installKeyboardHook({
            onRefresh: handleKeyboardAction.onRefresh,
            onPipeline: handleKeyboardAction.onPipeline,
            onAcknowledge: handleKeyboardAction.onAcknowledge,
            onFocusSearch: handleKeyboardAction.onFocusSearch,
            onNavigatePanel: handleKeyboardAction.onNavigatePanel,
        }, { target: consoleRef.current });
        return cleanup;
    }, [handleKeyboardAction]);
    return (_jsxs("div", { ref: consoleRef, className: "console-v3", role: "main", "aria-label": "Operator Console v3", children: [_jsx(ConsoleLiveRegions, { ref: consoleRef }), _jsxs("div", { className: "tier-1", children: [_jsx(HealthPanel, { status: healthData?.status || 'UNKNOWN', serviceCount: healthData?.serviceCount || 0, onRefresh: () => announce({ type: 'status', message: 'Health refreshed' }), ref: (el) => {
                            panelRefs.current[0] = el;
                        } }), _jsx(PipelinesPanel, { pipelineCount: pipelinesData?.length || 0, onRefresh: () => announce({ type: 'status', message: 'Pipelines refreshed' }), ref: (el) => {
                            panelRefs.current[1] = el;
                        } })] }), _jsx("div", { className: "tier-1-5", children: _jsx(CostComputePanel, { apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000', ref: (el) => {
                        panelRefs.current[5] = el;
                    } }) }), _jsxs("div", { className: "tier-2", children: [_jsx(AgentsPanel, { onRefresh: () => announce({ type: 'status', message: 'Agents refreshed' }), ref: (el) => {
                            panelRefs.current[2] = el;
                        } }), _jsx(AlertsPanel, { alertCount: alertsData?.length || 0, onRefresh: () => announce({ type: 'status', message: 'Alerts refreshed' }), ref: (el) => {
                            panelRefs.current[3] = el;
                        } }), _jsx(WorkspacePanel, { onRefresh: () => announce({ type: 'status', message: 'Workspace refreshed' }), ref: (el) => {
                            panelRefs.current[4] = el;
                        } })] }), _jsx(ControlsPanel, {}), _jsx("style", { children: `
        .console-v3 {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 16px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .tier-1 {
          display: grid;
          grid-template-columns: 60% 40%;
          gap: 16px;
          margin-bottom: 16px;
        }

        .tier-1-5 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .tier-2 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .panel {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          outline: 2px solid transparent;
          outline-offset: 2px;
        }

        .panel:focus {
          outline: 2px solid #0066cc;
          box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.1);
        }

        .panel h2 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .panel button {
          background: #0066cc;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 12px;
        }

        .panel button:hover {
          background: #0052a3;
        }

        .controls-panel {
          background: #f0f0f0;
          font-size: 12px;
          color: #666;
        }
      ` })] }));
};
ConsoleV3.displayName = 'ConsoleV3';
export default ConsoleV3;
//# sourceMappingURL=ConsoleV3.js.map