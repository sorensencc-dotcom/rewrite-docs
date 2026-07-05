import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Phase 3.6 Stream C: Live Regions for Async Events
 * ARIA-based announcements for screen readers during polling updates
 * Contract: Updates announced without focus shift, polite/assertive role parity
 */
import React, { useEffect, useRef, useCallback } from 'react';
/**
 * StatusLive: Polite announcements for state changes
 * Role: status, aria-live="polite"
 * Use: Pipeline state, health checks, async completions
 */
export const StatusLive = React.forwardRef(({ message, label = 'Status updates', className }, ref) => {
    const [currentMessage, setCurrentMessage] = React.useState('');
    const messageQueueRef = useRef([]);
    useEffect(() => {
        if (message) {
            messageQueueRef.current.push(message);
            setCurrentMessage(message);
            // Clear after announcement (allow screen reader time to process)
            const timeout = setTimeout(() => {
                messageQueueRef.current.shift();
                if (messageQueueRef.current.length > 0) {
                    setCurrentMessage(messageQueueRef.current[0]);
                }
                else {
                    setCurrentMessage('');
                }
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [message]);
    return (_jsx("div", { ref: ref, role: "status", "aria-live": "polite", "aria-atomic": "false", "aria-label": label, "data-testid": "status-live", style: { position: 'absolute', left: '-9999px' }, children: currentMessage }));
});
StatusLive.displayName = 'StatusLive';
/**
 * AlertLive: Assertive announcements for critical alerts
 * Role: alert, aria-live="assertive"
 * Use: Critical errors, security alerts, system failures
 */
export const AlertLive = React.forwardRef(({ message, label = 'Critical alerts', className }, ref) => {
    const [currentMessage, setCurrentMessage] = React.useState('');
    useEffect(() => {
        if (message) {
            setCurrentMessage(message);
            // Assertive alerts persist until explicitly cleared
            // Screen reader announces immediately, interrupting other content
        }
    }, [message]);
    return (_jsx("div", { ref: ref, role: "alert", "aria-live": "assertive", "aria-atomic": "true", "aria-label": label, "data-testid": "alert-live", style: { position: 'absolute', left: '-9999px' }, children: currentMessage }));
});
AlertLive.displayName = 'AlertLive';
/**
 * LogLive: Polite announcements for async task completion/progress
 * Role: status, aria-live="polite"
 * Use: Agent completion, pipeline task progress, background operations
 */
export const LogLive = React.forwardRef(({ message, label = 'Operation log', className }, ref) => {
    const [logs, setLogs] = React.useState([]);
    const logQueueRef = useRef([]);
    useEffect(() => {
        if (message) {
            logQueueRef.current.push(message);
            setLogs([...logQueueRef.current]);
            // Keep last 5 messages in history
            if (logQueueRef.current.length > 5) {
                logQueueRef.current.shift();
            }
        }
    }, [message]);
    return (_jsx("div", { ref: ref, role: "status", "aria-live": "polite", "aria-atomic": "false", "aria-label": label, "data-testid": "log-live", style: { position: 'absolute', left: '-9999px' }, children: logs.length > 0 && logs[logs.length - 1] }));
});
LogLive.displayName = 'LogLive';
export function useConsoleAnnouncements() {
    const statusRef = useRef(null);
    const alertRef = useRef(null);
    const logRef = useRef(null);
    const announce = useCallback((event) => {
        if (event.type === 'status') {
            if (statusRef.current) {
                statusRef.current.textContent = event.message;
            }
        }
        else if (event.type === 'alert') {
            if (alertRef.current) {
                alertRef.current.textContent = event.message;
            }
        }
        else if (event.type === 'log') {
            if (logRef.current) {
                logRef.current.textContent = event.message;
            }
        }
    }, []);
    return {
        statusRef,
        alertRef,
        logRef,
        announce,
    };
}
/**
 * ConsoleLiveRegions: Container for all live regions
 * Mount once at console root, use useConsoleAnnouncements() to announce
 */
export const ConsoleLiveRegions = React.forwardRef(({ className }, ref) => {
    const statusRef = useRef(null);
    const alertRef = useRef(null);
    const logRef = useRef(null);
    return (_jsxs("div", { ref: ref, className: className, "data-testid": "console-live-regions", style: { display: 'none' }, children: [_jsx(StatusLive, { ref: statusRef, label: "Console status updates", "data-testid": "status-live-container" }), _jsx(AlertLive, { ref: alertRef, label: "Console critical alerts", "data-testid": "alert-live-container" }), _jsx(LogLive, { ref: logRef, label: "Console operation log", "data-testid": "log-live-container" })] }));
});
ConsoleLiveRegions.displayName = 'ConsoleLiveRegions';
/**
 * Polling announcements: Convert API responses to live region updates
 * Used by Health, Pipelines, Alerts polling loops
 */
export var PollingAnnouncements;
(function (PollingAnnouncements) {
    function formatHealthAnnouncement(current, previous) {
        if (!previous || current.status === previous.status) {
            return null; // No status change, no announcement
        }
        if (current.status === 'OK') {
            return {
                type: 'status',
                message: `Health check passed, ${current.serviceCount} services operational`,
                duration: 3000,
            };
        }
        else if (current.status === 'DEGRADED') {
            return {
                type: 'status',
                message: `Health degraded, ${current.serviceCount} services affected`,
                duration: 3000,
            };
        }
        else if (current.status === 'DOWN') {
            return {
                type: 'alert',
                message: `Critical: System down, ${current.serviceCount} services unavailable`,
            };
        }
        return null;
    }
    PollingAnnouncements.formatHealthAnnouncement = formatHealthAnnouncement;
    function formatPipelineAnnouncement(pipelines, previousStates) {
        const announcements = [];
        pipelines.forEach((pipeline) => {
            const prevState = previousStates?.get(pipeline.id);
            if (prevState && prevState !== pipeline.state) {
                if (pipeline.state === 'running') {
                    announcements.push({
                        type: 'log',
                        message: `Pipeline ${pipeline.name} now running, ${pipeline.currentTask || 'processing'} in progress`,
                    });
                }
                else if (pipeline.state === 'paused') {
                    announcements.push({
                        type: 'log',
                        message: `Pipeline ${pipeline.name} paused`,
                    });
                }
                else if (pipeline.state === 'failed') {
                    announcements.push({
                        type: 'alert',
                        message: `Pipeline ${pipeline.name} failed`,
                    });
                }
            }
        });
        return announcements;
    }
    PollingAnnouncements.formatPipelineAnnouncement = formatPipelineAnnouncement;
    function formatAlertAnnouncement(alerts, previousAlerts) {
        const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
        const previousCritical = previousAlerts
            ?.filter((a) => a.severity === 'critical')
            .map((a) => a.id) ?? [];
        // New critical alert
        const newCritical = criticalAlerts.find((a) => !previousCritical.includes(a.id));
        if (newCritical) {
            return {
                type: 'alert',
                message: `Critical: ${newCritical.service} unresponsive, ${newCritical.duration}s down`,
            };
        }
        return null;
    }
    PollingAnnouncements.formatAlertAnnouncement = formatAlertAnnouncement;
})(PollingAnnouncements || (PollingAnnouncements = {}));
//# sourceMappingURL=live-regions.js.map