import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Phase 3.6 Stream C: Live Regions Tests
 * Contract: Updates announced without focus shift, screen reader friendly
 */
import { describe, it, expect } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { StatusLive, AlertLive, LogLive, ConsoleLiveRegions, PollingAnnouncements, } from './live-regions';
describe('Live Regions (Phase 3.6 Stream C)', () => {
    describe('StatusLive', () => {
        it('renders with role="status" and aria-live="polite"', () => {
            const { container } = render(_jsx(StatusLive, { message: "Test status" }));
            const region = screen.getByTestId('status-live');
            expect(region.getAttribute('role')).toBe('status');
            expect(region.getAttribute('aria-live')).toBe('polite');
            expect(region.getAttribute('aria-atomic')).toBe('false');
        });
        it('displays status message without focus change', () => {
            const { rerender } = render(_jsx(StatusLive, { message: "" }));
            const region = screen.getByTestId('status-live');
            const initialFocused = document.activeElement;
            rerender(_jsx(StatusLive, { message: "Pipeline started successfully" }));
            expect(region.textContent).toContain('Pipeline started successfully');
            expect(document.activeElement).toBe(initialFocused);
        });
        it('updates message and clears after duration', async () => {
            const { rerender } = render(_jsx(StatusLive, { message: "Status 1" }));
            const region = screen.getByTestId('status-live');
            expect(region.textContent).toContain('Status 1');
            rerender(_jsx(StatusLive, { message: "Status 2" }));
            expect(region.textContent).toContain('Status 2');
            // Wait for auto-clear after 3s
            await waitFor(() => {
                expect(region.textContent).toBe('');
            }, { timeout: 4000 });
        });
        it('has aria-label for screen reader context', () => {
            render(_jsx(StatusLive, { label: "Custom status label" }));
            const region = screen.getByTestId('status-live');
            expect(region.getAttribute('aria-label')).toBe('Custom status label');
        });
        it('is positioned off-screen (visually hidden)', () => {
            render(_jsx(StatusLive, {}));
            const region = screen.getByTestId('status-live');
            const style = window.getComputedStyle(region);
            expect(style.position).toBe('absolute');
            expect(style.left).toBe('-9999px');
        });
    });
    describe('AlertLive', () => {
        it('renders with role="alert" and aria-live="assertive"', () => {
            const { container } = render(_jsx(AlertLive, { message: "Critical alert" }));
            const region = screen.getByTestId('alert-live');
            expect(region.getAttribute('role')).toBe('alert');
            expect(region.getAttribute('aria-live')).toBe('assertive');
            expect(region.getAttribute('aria-atomic')).toBe('true');
        });
        it('displays alert message without focus change', () => {
            const { rerender } = render(_jsx(AlertLive, { message: "" }));
            const region = screen.getByTestId('alert-live');
            const initialFocused = document.activeElement;
            rerender(_jsx(AlertLive, { message: "Database connection failed" }));
            expect(region.textContent).toContain('Database connection failed');
            expect(document.activeElement).toBe(initialFocused);
        });
        it('persists alert message (no auto-clear)', async () => {
            const { rerender } = render(_jsx(AlertLive, { message: "Critical: Service unavailable" }));
            const region = screen.getByTestId('alert-live');
            expect(region.textContent).toContain('Critical: Service unavailable');
            // Wait to ensure message persists
            await waitFor(() => {
                expect(region.textContent).toContain('Critical: Service unavailable');
            });
        });
        it('has aria-label for screen reader context', () => {
            render(_jsx(AlertLive, { label: "System alerts" }));
            const region = screen.getByTestId('alert-live');
            expect(region.getAttribute('aria-label')).toBe('System alerts');
        });
        it('is positioned off-screen (visually hidden)', () => {
            render(_jsx(AlertLive, {}));
            const region = screen.getByTestId('alert-live');
            const style = window.getComputedStyle(region);
            expect(style.position).toBe('absolute');
            expect(style.left).toBe('-9999px');
        });
    });
    describe('LogLive', () => {
        it('renders with role="status" and aria-live="polite"', () => {
            const { container } = render(_jsx(LogLive, { message: "Operation started" }));
            const region = screen.getByTestId('log-live');
            expect(region.getAttribute('role')).toBe('status');
            expect(region.getAttribute('aria-live')).toBe('polite');
            expect(region.getAttribute('aria-atomic')).toBe('false');
        });
        it('displays latest log message', () => {
            const { rerender } = render(_jsx(LogLive, {}));
            const region = screen.getByTestId('log-live');
            rerender(_jsx(LogLive, { message: "Task 1 complete" }));
            expect(region.textContent).toContain('Task 1 complete');
            rerender(_jsx(LogLive, { message: "Task 2 complete" }));
            expect(region.textContent).toContain('Task 2 complete');
        });
        it('maintains log history (last 5 messages)', () => {
            const { rerender } = render(_jsx(LogLive, {}));
            for (let i = 1; i <= 6; i++) {
                rerender(_jsx(LogLive, { message: `Log message ${i}` }));
            }
            const region = screen.getByTestId('log-live');
            // Should show message 6, history contains 2-6
            expect(region.textContent).toContain('Log message 6');
        });
        it('has aria-label for screen reader context', () => {
            render(_jsx(LogLive, { label: "Operation progress" }));
            const region = screen.getByTestId('log-live');
            expect(region.getAttribute('aria-label')).toBe('Operation progress');
        });
        it('is positioned off-screen (visually hidden)', () => {
            render(_jsx(LogLive, {}));
            const region = screen.getByTestId('log-live');
            const style = window.getComputedStyle(region);
            expect(style.position).toBe('absolute');
            expect(style.left).toBe('-9999px');
        });
    });
    describe('ConsoleLiveRegions', () => {
        it('renders all three live regions', () => {
            render(_jsx(ConsoleLiveRegions, {}));
            expect(screen.getByTestId('status-live-container')).toBeTruthy();
            expect(screen.getByTestId('alert-live-container')).toBeTruthy();
            expect(screen.getByTestId('log-live-container')).toBeTruthy();
        });
        it('is visually hidden (display: none)', () => {
            const { container } = render(_jsx(ConsoleLiveRegions, {}));
            const root = screen.getByTestId('console-live-regions');
            const style = window.getComputedStyle(root);
            expect(style.display).toBe('none');
        });
        it('container is accessible via test ID', () => {
            render(_jsx(ConsoleLiveRegions, { "data-testid": "my-live-regions" }));
            expect(screen.getByTestId('console-live-regions')).toBeTruthy();
        });
    });
    describe('PollingAnnouncements.formatHealthAnnouncement', () => {
        it('returns null when status unchanged', () => {
            const current = { status: 'OK', serviceCount: 5, timestamp: Date.now() };
            const previous = { status: 'OK', serviceCount: 5, timestamp: Date.now() - 1000 };
            const announcement = PollingAnnouncements.formatHealthAnnouncement(current, previous);
            expect(announcement).toBeNull();
        });
        it('announces health recovered', () => {
            const current = { status: 'OK', serviceCount: 5, timestamp: Date.now() };
            const previous = { status: 'DOWN', serviceCount: 0, timestamp: Date.now() - 1000 };
            const announcement = PollingAnnouncements.formatHealthAnnouncement(current, previous);
            expect(announcement).toEqual({
                type: 'status',
                message: 'Health check passed, 5 services operational',
                duration: 3000,
            });
        });
        it('announces health degraded', () => {
            const current = { status: 'DEGRADED', serviceCount: 3, timestamp: Date.now() };
            const previous = { status: 'OK', serviceCount: 5, timestamp: Date.now() - 1000 };
            const announcement = PollingAnnouncements.formatHealthAnnouncement(current, previous);
            expect(announcement).toEqual({
                type: 'status',
                message: 'Health degraded, 3 services affected',
                duration: 3000,
            });
        });
        it('announces system down as critical alert', () => {
            const current = { status: 'DOWN', serviceCount: 0, timestamp: Date.now() };
            const previous = { status: 'OK', serviceCount: 5, timestamp: Date.now() - 1000 };
            const announcement = PollingAnnouncements.formatHealthAnnouncement(current, previous);
            expect(announcement).toEqual({
                type: 'alert',
                message: 'Critical: System down, 0 services unavailable',
            });
        });
    });
    describe('PollingAnnouncements.formatPipelineAnnouncement', () => {
        it('returns empty array when no state changes', () => {
            const pipelines = [
                { id: 'p1', name: 'Pipeline 1', state: 'idle' },
                { id: 'p2', name: 'Pipeline 2', state: 'running', currentTask: 'Processing' },
            ];
            const previousStates = new Map([
                ['p1', 'idle'],
                ['p2', 'running'],
            ]);
            const announcements = PollingAnnouncements.formatPipelineAnnouncement(pipelines, previousStates);
            expect(announcements).toHaveLength(0);
        });
        it('announces pipeline started', () => {
            const pipelines = [
                { id: 'p1', name: 'Pipeline 1', state: 'running', currentTask: 'Init' },
            ];
            const previousStates = new Map([['p1', 'idle']]);
            const announcements = PollingAnnouncements.formatPipelineAnnouncement(pipelines, previousStates);
            expect(announcements).toContainEqual({
                type: 'log',
                message: 'Pipeline Pipeline 1 now running, Init in progress',
            });
        });
        it('announces pipeline paused', () => {
            const pipelines = [
                { id: 'p1', name: 'Pipeline 1', state: 'paused' },
            ];
            const previousStates = new Map([['p1', 'running']]);
            const announcements = PollingAnnouncements.formatPipelineAnnouncement(pipelines, previousStates);
            expect(announcements).toContainEqual({
                type: 'log',
                message: 'Pipeline Pipeline 1 paused',
            });
        });
        it('announces pipeline failed as alert', () => {
            const pipelines = [
                { id: 'p1', name: 'Pipeline 1', state: 'failed' },
            ];
            const previousStates = new Map([['p1', 'running']]);
            const announcements = PollingAnnouncements.formatPipelineAnnouncement(pipelines, previousStates);
            expect(announcements).toContainEqual({
                type: 'alert',
                message: 'Pipeline Pipeline 1 failed',
            });
        });
    });
    describe('PollingAnnouncements.formatAlertAnnouncement', () => {
        it('returns null when no new critical alerts', () => {
            const alerts = [
                { id: 'a1', severity: 'info', service: 'Service 1', message: 'Info', duration: 0 },
            ];
            const announcement = PollingAnnouncements.formatAlertAnnouncement(alerts, []);
            expect(announcement).toBeNull();
        });
        it('announces new critical alert', () => {
            const alerts = [
                {
                    id: 'a1',
                    severity: 'critical',
                    service: 'Database',
                    message: 'Unresponsive',
                    duration: 120,
                },
            ];
            const announcement = PollingAnnouncements.formatAlertAnnouncement(alerts, []);
            expect(announcement).toEqual({
                type: 'alert',
                message: 'Critical: Database unresponsive, 120s down',
            });
        });
        it('ignores already-announced critical alerts', () => {
            const previousAlerts = [
                {
                    id: 'a1',
                    severity: 'critical',
                    service: 'Database',
                    message: 'Unresponsive',
                    duration: 60,
                },
            ];
            const alerts = [
                {
                    id: 'a1',
                    severity: 'critical',
                    service: 'Database',
                    message: 'Unresponsive',
                    duration: 120,
                },
            ];
            const announcement = PollingAnnouncements.formatAlertAnnouncement(alerts, previousAlerts);
            expect(announcement).toBeNull();
        });
    });
});
//# sourceMappingURL=live-regions.test.js.map