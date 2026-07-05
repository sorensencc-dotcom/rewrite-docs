/**
 * Phase 3.6 Stream C: Live Regions for Async Events
 * ARIA-based announcements for screen readers during polling updates
 * Contract: Updates announced without focus shift, polite/assertive role parity
 */
import React from 'react';
export interface LiveRegionMessage {
    id: string;
    message: string;
    level: 'polite' | 'assertive';
    timestamp: number;
    duration?: number;
}
/**
 * StatusLive: Polite announcements for state changes
 * Role: status, aria-live="polite"
 * Use: Pipeline state, health checks, async completions
 */
export declare const StatusLive: React.ForwardRefExoticComponent<{
    message?: string;
    label?: string;
    className?: string;
} & React.RefAttributes<HTMLDivElement>>;
/**
 * AlertLive: Assertive announcements for critical alerts
 * Role: alert, aria-live="assertive"
 * Use: Critical errors, security alerts, system failures
 */
export declare const AlertLive: React.ForwardRefExoticComponent<{
    message?: string;
    label?: string;
    className?: string;
} & React.RefAttributes<HTMLDivElement>>;
/**
 * LogLive: Polite announcements for async task completion/progress
 * Role: status, aria-live="polite"
 * Use: Agent completion, pipeline task progress, background operations
 */
export declare const LogLive: React.ForwardRefExoticComponent<{
    message?: string;
    label?: string;
    className?: string;
} & React.RefAttributes<HTMLDivElement>>;
/**
 * useConsoleAnnouncements: Hook for managing live region updates
 * Coordinates StatusLive, AlertLive, LogLive from polling or event-driven sources
 */
export interface AnnouncementEvent {
    type: 'status' | 'alert' | 'log';
    message: string;
    duration?: number;
}
export declare function useConsoleAnnouncements(): {
    statusRef: React.RefObject<HTMLDivElement>;
    alertRef: React.RefObject<HTMLDivElement>;
    logRef: React.RefObject<HTMLDivElement>;
    announce: (event: AnnouncementEvent) => void;
};
/**
 * ConsoleLiveRegions: Container for all live regions
 * Mount once at console root, use useConsoleAnnouncements() to announce
 */
export declare const ConsoleLiveRegions: React.ForwardRefExoticComponent<{
    className?: string;
} & React.RefAttributes<HTMLDivElement>>;
/**
 * Polling announcements: Convert API responses to live region updates
 * Used by Health, Pipelines, Alerts polling loops
 */
export declare namespace PollingAnnouncements {
    interface HealthPollResult {
        status: 'OK' | 'DEGRADED' | 'DOWN';
        serviceCount: number;
        timestamp: number;
    }
    function formatHealthAnnouncement(current: HealthPollResult, previous?: HealthPollResult): AnnouncementEvent | null;
    interface PipelinePollResult {
        id: string;
        name: string;
        state: 'idle' | 'running' | 'paused' | 'failed';
        currentTask?: string;
        progress?: number;
    }
    function formatPipelineAnnouncement(pipelines: PipelinePollResult[], previousStates?: Map<string, string>): AnnouncementEvent[];
    interface AlertPollResult {
        id: string;
        severity: 'info' | 'warning' | 'error' | 'critical';
        service: string;
        message: string;
        duration: number;
    }
    function formatAlertAnnouncement(alerts: AlertPollResult[], previousAlerts?: AlertPollResult[]): AnnouncementEvent | null;
}
//# sourceMappingURL=live-regions.d.ts.map