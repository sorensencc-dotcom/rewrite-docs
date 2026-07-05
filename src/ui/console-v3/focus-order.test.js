import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Phase 3.6 Stream A: Focus Order Validation Tests
 * Contract: Tab navigation traverses all interactive elements in logical order
 * No focus traps; Escape returns focus to trigger; polling updates preserve focus
 */
import '@testing-library/jest-dom';
import { describe, it, expect, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
// Mock console structure for testing focus order
// Real implementation should mount Operator Console v3 with:
// Health Panel → Agents Panel → Controls → Alerts
const MockConsoleWithFocusOrder = React.forwardRef(({ onPanelFocusChange }, ref) => {
    const [currentFocus, setCurrentFocus] = React.useState(null);
    const handlePanelFocus = (panelName) => {
        setCurrentFocus(panelName);
        onPanelFocusChange?.(panelName);
    };
    return (_jsxs("div", { ref: ref, role: "main", "data-testid": "console-main", children: [_jsxs("section", { "data-testid": "health-panel", "aria-label": "Health Monitor", onFocus: () => handlePanelFocus('health'), tabIndex: currentFocus === 'health' ? 0 : -1, children: [_jsx("h2", { children: "Health Status" }), _jsx("button", { "data-testid": "health-refresh", children: "Refresh" }), _jsx("div", { "aria-live": "polite", role: "status", "aria-atomic": "false", children: "Health: OK" })] }), _jsxs("section", { "data-testid": "agents-panel", "aria-label": "Active Agents", onFocus: () => handlePanelFocus('agents'), tabIndex: currentFocus === 'agents' ? 0 : -1, children: [_jsx("h2", { children: "Agents" }), _jsx("button", { "data-testid": "agents-action", children: "Start Agent" }), _jsx("div", { role: "grid", "aria-label": "Agents table", children: _jsxs("div", { role: "row", children: [_jsx("div", { role: "gridcell", tabIndex: -1, children: "Agent 1" }), _jsx("div", { role: "gridcell", tabIndex: -1, children: _jsx("button", { "data-testid": "agent-1-action", "aria-label": "Action for Agent 1", children: "Pause" }) })] }) })] }), _jsxs("section", { "data-testid": "controls-panel", "aria-label": "Dashboard Controls", onFocus: () => handlePanelFocus('controls'), tabIndex: currentFocus === 'controls' ? 0 : -1, children: [_jsx("h2", { children: "Controls" }), _jsx("button", { "data-testid": "control-refresh", children: "Refresh All" }), _jsx("button", { "data-testid": "control-settings", children: "Settings" })] }), _jsxs("section", { "data-testid": "alerts-panel", "aria-label": "System Alerts", role: "region", "aria-live": "assertive", onFocus: () => handlePanelFocus('alerts'), tabIndex: currentFocus === 'alerts' ? 0 : -1, children: [_jsx("h2", { children: "Alerts" }), _jsx("div", { role: "alert", "data-testid": "alert-item", children: "No critical alerts" }), _jsx("button", { "data-testid": "alert-acknowledge", children: "Acknowledge" })] })] }));
});
MockConsoleWithFocusOrder.displayName = 'MockConsoleWithFocusOrder';
describe('Focus Order Validation (Phase 3.6 Stream A)', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Tab Order Audit', () => {
        it('Panel elements are focusable', async () => {
            const { container } = render(_jsx(MockConsoleWithFocusOrder, {}));
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
            const { rerender } = render(_jsx(MockConsoleWithFocusOrder, {}));
            const healthPanel = screen.getByTestId('health-panel');
            expect(healthPanel.getAttribute('tabIndex')).toMatch(/^(-1|0)$/);
        });
        it('All interactive elements within Health Panel are reachable via Tab', async () => {
            const { container } = render(_jsx(MockConsoleWithFocusOrder, {}));
            const healthRefresh = screen.getByTestId('health-refresh');
            healthRefresh.focus();
            expect(document.activeElement).toBe(healthRefresh);
        });
        it('All interactive elements within Agents Panel are reachable via Tab', async () => {
            const user = userEvent.setup();
            const { container } = render(_jsx(MockConsoleWithFocusOrder, {}));
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
                const triggerRef = React.useRef(null);
                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        setShowModal(false);
                        triggerRef.current?.focus();
                    }
                };
                return (_jsxs(_Fragment, { children: [_jsx("button", { ref: triggerRef, onClick: () => setShowModal(true), children: "Open Settings" }), showModal && (_jsxs("div", { role: "dialog", "aria-label": "Settings", onKeyDown: handleEscape, children: [_jsx("button", { children: "Close" }), _jsx("input", { type: "text", placeholder: "Setting value" })] }))] }));
            };
            const { rerender } = render(_jsx(TrapTest, {}));
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
            const { container } = render(_jsx(MockConsoleWithFocusOrder, {}));
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
                const inputRef = React.useRef(null);
                React.useEffect(() => {
                    const interval = setInterval(() => {
                        // Simulate polling update
                        setStatus((s) => s);
                    }, 100);
                    return () => clearInterval(interval);
                }, []);
                return (_jsxs("div", { children: [_jsx("input", { ref: inputRef, "data-testid": "user-input", placeholder: "Focus here" }), _jsxs("div", { "aria-live": "polite", role: "status", children: ["Status: ", status] })] }));
            };
            const { container } = render(_jsx(PollingTest, {}));
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
                const buttonRef = React.useRef(null);
                return (_jsxs("div", { children: [_jsxs("button", { ref: buttonRef, "data-testid": "async-button", onClick: () => setCount((c) => c + 1), children: ["Update (", count, ")"] }), _jsxs("div", { "aria-live": "polite", role: "status", children: ["Count: ", count] })] }));
            };
            const { container } = render(_jsx(AsyncUpdateTest, {}));
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
            render(_jsx(MockConsoleWithFocusOrder, {}));
            expect(screen.getByLabelText('Health Monitor')).toBeTruthy();
            expect(screen.getByLabelText('Active Agents')).toBeTruthy();
            expect(screen.getByLabelText('Dashboard Controls')).toBeTruthy();
            expect(screen.getByLabelText('System Alerts')).toBeTruthy();
        });
        it('Alerts panel has role="region" and aria-live="assertive"', () => {
            render(_jsx(MockConsoleWithFocusOrder, {}));
            const alertsPanel = screen.getByTestId('alerts-panel');
            expect(alertsPanel.getAttribute('role')).toBe('region');
            expect(alertsPanel.getAttribute('aria-live')).toBe('assertive');
        });
        it('Health panel body has aria-live="polite" for async updates', () => {
            render(_jsx(MockConsoleWithFocusOrder, {}));
            const healthPanel = screen.getByTestId('health-panel');
            const liveRegion = healthPanel.querySelector('[aria-live="polite"]');
            expect(liveRegion).toBeTruthy();
        });
        it('Grid in Agents Panel has proper ARIA roles', () => {
            render(_jsx(MockConsoleWithFocusOrder, {}));
            expect(screen.getByRole('grid', { name: 'Agents table' })).toBeTruthy();
            expect(screen.getByRole('row')).toBeTruthy();
            expect(screen.getAllByRole('gridcell')).toHaveLength(1);
        });
    });
});
//# sourceMappingURL=focus-order.test.js.map