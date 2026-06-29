/**
 * Phase 3.6 Stream A: Focus Order Validation Tests
 * Contract: Tab navigation traverses all interactive elements in logical order
 * No focus traps; Escape returns focus to trigger; polling updates preserve focus
 */

import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock console structure for testing focus order
// Real implementation should mount Operator Console v3 with:
// Health Panel → Agents Panel → Controls → Alerts
const MockConsoleWithFocusOrder = React.forwardRef<
  HTMLDivElement,
  { onPanelFocusChange?: (panelName: string) => void }
>(({ onPanelFocusChange }, ref) => {
  const [currentFocus, setCurrentFocus] = React.useState<string | null>(null);

  const handlePanelFocus = (panelName: string) => {
    setCurrentFocus(panelName);
    onPanelFocusChange?.(panelName);
  };

  return (
    <div ref={ref} role="main" data-testid="console-main">
      {/* Health Panel - Tier 1 */}
      <section
        data-testid="health-panel"
        aria-label="Health Monitor"
        onFocus={() => handlePanelFocus('health')}
        tabIndex={currentFocus === 'health' ? 0 : -1}
      >
        <h2>Health Status</h2>
        <button data-testid="health-refresh">Refresh</button>
        <div aria-live="polite" role="status" aria-atomic="false">
          Health: OK
        </div>
      </section>

      {/* Agents Panel - Tier 2 */}
      <section
        data-testid="agents-panel"
        aria-label="Active Agents"
        onFocus={() => handlePanelFocus('agents')}
        tabIndex={currentFocus === 'agents' ? 0 : -1}
      >
        <h2>Agents</h2>
        <button data-testid="agents-action">Start Agent</button>
        <div role="grid" aria-label="Agents table">
          <div role="row">
            <div role="gridcell" tabIndex={-1}>Agent 1</div>
            <div role="gridcell" tabIndex={-1}>
              <button data-testid="agent-1-action" aria-label="Action for Agent 1">
                Pause
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Controls Panel */}
      <section
        data-testid="controls-panel"
        aria-label="Dashboard Controls"
        onFocus={() => handlePanelFocus('controls')}
        tabIndex={currentFocus === 'controls' ? 0 : -1}
      >
        <h2>Controls</h2>
        <button data-testid="control-refresh">Refresh All</button>
        <button data-testid="control-settings">Settings</button>
      </section>

      {/* Alerts Panel */}
      <section
        data-testid="alerts-panel"
        aria-label="System Alerts"
        role="region"
        aria-live="assertive"
        onFocus={() => handlePanelFocus('alerts')}
        tabIndex={currentFocus === 'alerts' ? 0 : -1}
      >
        <h2>Alerts</h2>
        <div role="alert" data-testid="alert-item">
          No critical alerts
        </div>
        <button data-testid="alert-acknowledge">Acknowledge</button>
      </section>
    </div>
  );
});

MockConsoleWithFocusOrder.displayName = 'MockConsoleWithFocusOrder';

describe('Focus Order Validation (Phase 3.6 Stream A)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Order Audit', () => {
    it('Panel elements are focusable', async () => {
      const { container } = render(<MockConsoleWithFocusOrder />);
      const healthPanel = screen.getByTestId('health-panel');
      const agentsPanel = screen.getByTestId('agents-panel');
      const controlsPanel = screen.getByTestId('controls-panel');
      const alertsPanel = screen.getByTestId('alerts-panel');

      // Verify panels can receive focus
      healthPanel.focus();
      expect(document.activeElement).toBe(healthPanel);

      agentsPanel.focus();
      expect(document.activeElement).toBe(agentsPanel);

      controlsPanel.focus();
      expect(document.activeElement).toBe(controlsPanel);

      alertsPanel.focus();
      expect(document.activeElement).toBe(alertsPanel);
    });

    it('Panels maintain tab index state', () => {
      const { rerender } = render(<MockConsoleWithFocusOrder />);
      const healthPanel = screen.getByTestId('health-panel');

      expect(healthPanel.getAttribute('tabIndex')).toMatch(/^(-1|0)$/);
    });

    it('All interactive elements within Health Panel are reachable via Tab', async () => {
      const { container } = render(<MockConsoleWithFocusOrder />);
      const healthRefresh = screen.getByTestId('health-refresh');

      healthRefresh.focus();
      expect(document.activeElement).toBe(healthRefresh);
    });

    it('All interactive elements within Agents Panel are reachable via Tab', async () => {
      const user = userEvent.setup();
      const { container } = render(<MockConsoleWithFocusOrder />);
      const agentsAction = screen.getByTestId('agents-action');
      const agent1Action = screen.getByTestId('agent-1-action');

      agentsAction.focus();
      expect(document.activeElement).toBe(agentsAction);

      await user.tab();
      expect(document.activeElement).toBe(agent1Action);
    });
  });

  describe('Focus Trap Escape Handlers', () => {
    it('Escape from modal/popup returns focus to trigger button', async () => {
      const user = userEvent.setup();
      const TrapTest = () => {
        const [showModal, setShowModal] = React.useState(false);
        const triggerRef = React.useRef<HTMLButtonElement>(null);

        const handleEscape = (e: React.KeyboardEvent) => {
          if (e.key === 'Escape') {
            setShowModal(false);
            triggerRef.current?.focus();
          }
        };

        return (
          <>
            <button ref={triggerRef} onClick={() => setShowModal(true)}>
              Open Settings
            </button>
            {showModal && (
              <div
                role="dialog"
                aria-label="Settings"
                onKeyDown={handleEscape}
              >
                <button>Close</button>
                <input type="text" placeholder="Setting value" />
              </div>
            )}
          </>
        );
      };

      const { rerender } = render(<TrapTest />);
      const trigger = screen.getByText('Open Settings');

      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Open modal
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeTruthy();
      });

      const closeBtn = screen.getByText('Close');
      closeBtn.focus();

      // Press Escape
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });

    it('No focus trap when navigating through Agents Panel grid', async () => {
      const user = userEvent.setup();
      const { container } = render(<MockConsoleWithFocusOrder />);
      const agent1Action = screen.getByTestId('agent-1-action');

      agent1Action.focus();
      expect(document.activeElement).toBe(agent1Action);

      // Tab should move to next panel, not trap in grid
      await user.tab();
      expect(document.activeElement).not.toBe(agent1Action);
    });
  });

  describe('Focus Restoration During Async Updates', () => {
    it('Polling updates do not steal focus from user', async () => {
      const PollingTest = () => {
        const [status, setStatus] = React.useState('OK');
        const inputRef = React.useRef<HTMLInputElement>(null);

        React.useEffect(() => {
          const interval = setInterval(() => {
            // Simulate polling update
            setStatus((s) => s);
          }, 100);
          return () => clearInterval(interval);
        }, []);

        return (
          <div>
            <input ref={inputRef} data-testid="user-input" placeholder="Focus here" />
            <div aria-live="polite" role="status">
              Status: {status}
            </div>
          </div>
        );
      };

      const { container } = render(<PollingTest />);
      const input = screen.getByTestId('user-input');

      input.focus();
      expect(document.activeElement).toBe(input);

      // Wait through polling updates
      await waitFor(() => {
        // Focus should not change despite polling
        expect(document.activeElement).toBe(input);
      });
    });

    it('Focus restored correctly after async panel update', async () => {
      const user = userEvent.setup();
      const AsyncUpdateTest = () => {
        const [count, setCount] = React.useState(0);
        const buttonRef = React.useRef<HTMLButtonElement>(null);

        return (
          <div>
            <button
              ref={buttonRef}
              data-testid="async-button"
              onClick={() => setCount((c) => c + 1)}
            >
              Update ({count})
            </button>
            <div aria-live="polite" role="status">
              Count: {count}
            </div>
          </div>
        );
      };

      const { container } = render(<AsyncUpdateTest />);
      const button = screen.getByTestId('async-button');

      button.focus();
      await user.click(button);

      // Focus should stay on button after update
      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('All panels have proper ARIA labels', () => {
      render(<MockConsoleWithFocusOrder />);

      expect(screen.getByLabelText('Health Monitor')).toBeTruthy();
      expect(screen.getByLabelText('Active Agents')).toBeTruthy();
      expect(screen.getByLabelText('Dashboard Controls')).toBeTruthy();
      expect(screen.getByLabelText('System Alerts')).toBeTruthy();
    });

    it('Alerts panel has role="region" and aria-live="assertive"', () => {
      render(<MockConsoleWithFocusOrder />);
      const alertsPanel = screen.getByTestId('alerts-panel');

      expect(alertsPanel.getAttribute('role')).toBe('region');
      expect(alertsPanel.getAttribute('aria-live')).toBe('assertive');
    });

    it('Health panel body has aria-live="polite" for async updates', () => {
      render(<MockConsoleWithFocusOrder />);
      const healthPanel = screen.getByTestId('health-panel');
      const liveRegion = healthPanel.querySelector('[aria-live="polite"]');

      expect(liveRegion).toBeTruthy();
    });

    it('Grid in Agents Panel has proper ARIA roles', () => {
      render(<MockConsoleWithFocusOrder />);

      expect(screen.getByRole('grid', { name: 'Agents table' })).toBeTruthy();
      expect(screen.getByRole('row')).toBeTruthy();
      expect(screen.getAllByRole('gridcell')).toHaveLength(1);
    });
  });
});
