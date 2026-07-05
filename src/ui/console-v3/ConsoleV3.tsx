/**
 * Phase 3.6: Operator Console v3 Root Component
 * Integrates accessibility (keyboard, live regions, focus order) with 6-panel dashboard
 * Polling → announcements wiring + keyboard controls
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ConsoleLiveRegions,
  useConsoleAnnouncements,
  PollingAnnouncements,
  AnnouncementEvent,
} from './live-regions';
import { installKeyboardHook, KeyboardHookCallbacks } from './keyboard-shortcuts';
import { useConsolePolling } from './useConsoleAPI';
import { CostComputePanel } from '../../components/CostComputePanel';

// Panel component placeholders (with forwardRef support)
interface HealthPanelProps {
  onRefresh?: () => void;
  status?: string;
  serviceCount?: number;
}

const HealthPanel = React.forwardRef<HTMLDivElement, HealthPanelProps>(
  ({ onRefresh, status = 'OK', serviceCount = 0 }, ref) => (
    <div ref={ref} role="region" aria-labelledby="health-title" tabIndex={0} className="panel health-panel">
      <h2 id="health-title">Health</h2>
      <div>Status: {status}</div>
      <div>Services: {serviceCount}</div>
      <button type="button" onClick={onRefresh}>Refresh</button>
    </div>
  )
);
HealthPanel.displayName = 'HealthPanel';

interface PipelinesPanelProps {
  onRefresh?: () => void;
  pipelineCount?: number;
}

const PipelinesPanel = React.forwardRef<HTMLDivElement, PipelinesPanelProps>(
  ({ onRefresh, pipelineCount = 0 }, ref) => (
    <div ref={ref} role="region" aria-labelledby="pipelines-title" tabIndex={0} className="panel pipelines-panel">
      <h2 id="pipelines-title">Pipelines</h2>
      <div>{pipelineCount} active pipelines</div>
      <button type="button" onClick={onRefresh}>Refresh</button>
    </div>
  )
);
PipelinesPanel.displayName = 'PipelinesPanel';

const AgentsPanel = React.forwardRef<HTMLDivElement, { onRefresh?: () => void }>(
  ({ onRefresh }, ref) => (
    <div ref={ref} role="region" aria-labelledby="agents-title" tabIndex={0} className="panel agents-panel">
      <h2 id="agents-title">Agents</h2>
      <div>0 agents online</div>
      <button type="button" onClick={onRefresh}>Refresh</button>
    </div>
  )
);
AgentsPanel.displayName = 'AgentsPanel';

interface AlertsPanelProps {
  onRefresh?: () => void;
  alertCount?: number;
}

const AlertsPanel = React.forwardRef<HTMLDivElement, AlertsPanelProps>(
  ({ onRefresh, alertCount = 0 }, ref) => (
    <div ref={ref} role="region" aria-labelledby="alerts-title" tabIndex={0} className="panel alerts-panel">
      <h2 id="alerts-title">Alerts</h2>
      <div>{alertCount} active alerts</div>
      <button type="button" onClick={onRefresh}>Refresh</button>
    </div>
  )
);
AlertsPanel.displayName = 'AlertsPanel';

const WorkspacePanel = React.forwardRef<HTMLDivElement, { onRefresh?: () => void }>(
  ({ onRefresh }, ref) => (
    <div ref={ref} role="region" aria-labelledby="workspace-title" tabIndex={0} className="panel workspace-panel">
      <h2 id="workspace-title">Workspace</h2>
      <div>User: operator</div>
      <button type="button" onClick={onRefresh}>Refresh</button>
    </div>
  )
);
WorkspacePanel.displayName = 'WorkspacePanel';

const ControlsPanel = () => (
  <div role="region" aria-labelledby="controls-title" className="panel controls-panel">
    <h2 id="controls-title">Controls</h2>
    <div>Ctrl+R: Refresh Health | Ctrl+Shift+R: Refresh All | P+N: Pause Pipeline | [ / ]: Navigate</div>
  </div>
);

/**
 * ConsoleV3: Main root component
 * Layout: Tier 1 (60/40), Tier 2 (33/33/33), Tier 3 (100%)
 * Integrates Phase 3.6 accessibility + polling + announcements
 */
export const ConsoleV3: React.FC = () => {
  const consoleRef = useRef<HTMLDivElement>(null);
  const { statusRef, alertRef, logRef, announce } = useConsoleAnnouncements();

  // API polling
  const { health: healthData, pipelines: pipelinesData, alerts: alertsData, start: startPolling } = useConsolePolling({
    health: 10000,
    pipelines: 5000,
    alerts: 3000,
  });

  // Track previous state for announcements
  const [previousHealthStatus, setPreviousHealthStatus] = useState<any>(null);
  const [previousPipelines, setPreviousPipelines] = useState<Map<string, string>>(new Map());
  const [previousAlerts, setPreviousAlerts] = useState<any[]>([]);

  // Panel ref for focus navigation
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedPanelIndex, setFocusedPanelIndex] = useState(0);

  // Setup polling on mount
  useEffect(() => {
    const cleanup = startPolling();
    return cleanup;
  }, [startPolling]);

  // Announce health changes
  useEffect(() => {
    if (!healthData) return;
    const announcement = PollingAnnouncements.formatHealthAnnouncement(
      { status: healthData.status, serviceCount: healthData.serviceCount, timestamp: healthData.timestamp },
      previousHealthStatus
    );
    if (announcement) {
      announce(announcement);
    }
    setPreviousHealthStatus(healthData);
  }, [healthData, announce, previousHealthStatus]);

  // Announce pipeline changes
  useEffect(() => {
    if (!pipelinesData || pipelinesData.length === 0) return;
    const previousMap = new Map(previousPipelines);
    const announcements = PollingAnnouncements.formatPipelineAnnouncement(
      pipelinesData.map((p: any) => ({ id: p.id, state: p.state, name: p.name || '' })) as any,
      previousMap
    );
    announcements.forEach((a) => announce(a));
    const newMap = new Map(pipelinesData.map((p: any) => [p.id, p.state]));
    setPreviousPipelines(newMap);
  }, [pipelinesData, announce, previousPipelines]);

  // Announce alert changes
  useEffect(() => {
    if (!alertsData || alertsData.length === 0) return;
    const announcement = PollingAnnouncements.formatAlertAnnouncement(alertsData as any, previousAlerts);
    if (announcement) {
      announce(announcement);
    }
    setPreviousAlerts(alertsData);
  }, [alertsData, announce, previousAlerts]);

  // Keyboard shortcuts handler
  const handleKeyboardAction = useCallback(() => ({
    onRefresh: (target: any) => {
      if (target === 'health') {
        announce({ type: 'status', message: 'Health panel refreshed' });
      } else if (target === 'all') {
        announce({ type: 'status', message: 'All panels refreshed' });
      }
    },
    onPipeline: (action: any, pipelineNumber: any) => {
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
    onNavigatePanel: (direction: any) => {
      let nextIndex = focusedPanelIndex;
      if (direction === 'next') {
        nextIndex = (focusedPanelIndex + 1) % panelRefs.current.length;
      } else if (direction === 'prev') {
        nextIndex = (focusedPanelIndex - 1 + panelRefs.current.length) % panelRefs.current.length;
      }
      setFocusedPanelIndex(nextIndex);
      panelRefs.current[nextIndex]?.focus();
      announce({
        type: 'status',
        message: `Focused panel ${nextIndex + 1}`,
      });
    },
  }), [focusedPanelIndex, announce]);

  // Install keyboard hook on mount
  useEffect(() => {
    if (!consoleRef.current) return;

    const keyboardCallbacks = handleKeyboardAction();
    const cleanup = installKeyboardHook(
      {
        onRefresh: keyboardCallbacks.onRefresh,
        onPipeline: keyboardCallbacks.onPipeline,
        onAcknowledge: keyboardCallbacks.onAcknowledge,
        onFocusSearch: keyboardCallbacks.onFocusSearch,
        onNavigatePanel: keyboardCallbacks.onNavigatePanel,
      },
      { target: consoleRef.current }
    );

    return cleanup;
  }, [handleKeyboardAction]);

  return (
    <div
      ref={consoleRef}
      className="console-v3"
      role="main"
      aria-label="Operator Console v3"
    >
      {/* Live regions (ARIA announcements for screen readers) */}
      <ConsoleLiveRegions ref={consoleRef} />

      {/* Tier 1: Health (60%) + Pipelines (40%) */}
      <div className="tier-1">
        <HealthPanel
          status={healthData?.status || 'UNKNOWN'}
          serviceCount={healthData?.serviceCount || 0}
          onRefresh={() => announce({ type: 'status', message: 'Health refreshed' })}
          ref={(el) => {
            panelRefs.current[0] = el;
          }}
        />
        <PipelinesPanel
          pipelineCount={pipelinesData?.length || 0}
          onRefresh={() => announce({ type: 'status', message: 'Pipelines refreshed' })}
          ref={(el) => {
            panelRefs.current[1] = el;
          }}
        />
      </div>

      {/* Tier 1.5: Cost Compute Panel (100%) */}
      <div className="tier-1-5">
        <CostComputePanel
          apiBaseUrl={process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}
          ref={(el) => {
            panelRefs.current[5] = el;
          }}
        />
      </div>

      {/* Tier 2: Agents (33%) + Alerts (33%) + Workspace (33%) */}
      <div className="tier-2">
        <AgentsPanel
          onRefresh={() => announce({ type: 'status', message: 'Agents refreshed' })}
          ref={(el) => {
            panelRefs.current[2] = el;
          }}
        />
        <AlertsPanel
          alertCount={alertsData?.length || 0}
          onRefresh={() => announce({ type: 'status', message: 'Alerts refreshed' })}
          ref={(el) => {
            panelRefs.current[3] = el;
          }}
        />
        <WorkspacePanel
          onRefresh={() => announce({ type: 'status', message: 'Workspace refreshed' })}
          ref={(el) => {
            panelRefs.current[4] = el;
          }}
        />
      </div>

      {/* Tier 3: Controls (100%) */}
      <ControlsPanel />

      {/* Styles */}
      <style>{`
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
      `}</style>
    </div>
  );
};

ConsoleV3.displayName = 'ConsoleV3';

export default ConsoleV3;
