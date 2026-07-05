/**
 * useConsoleAPI - Hooks for ConsoleV3 data fetching
 * Polls health, pipelines, alerts from backend
 */
export interface HealthStatus {
    status: 'OK' | 'DEGRADED' | 'DOWN';
    serviceCount: number;
    timestamp: number;
}
export interface Pipeline {
    id: string;
    name: string;
    state: 'idle' | 'running' | 'paused' | 'failed';
    progress?: number;
    timestamp: number;
}
export interface Alert {
    id: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    timestamp: number;
}
export declare function useHealthStatus(): {
    health: HealthStatus | null;
    error: string | null;
    loading: boolean;
    fetch: () => Promise<void>;
};
export declare function usePipelines(): {
    pipelines: Pipeline[];
    error: string | null;
    loading: boolean;
    fetch: () => Promise<void>;
};
export declare function useAlerts(): {
    alerts: Alert[];
    error: string | null;
    loading: boolean;
    fetch: () => Promise<void>;
};
/**
 * useConsolePolling - Convenience hook for all three polls with intervals
 */
export declare function useConsolePolling(intervals?: {
    health?: number;
    pipelines?: number;
    alerts?: number;
}): {
    health: HealthStatus | null;
    pipelines: Pipeline[];
    alerts: Alert[];
    start: () => () => void;
    stop: () => void;
};
//# sourceMappingURL=useConsoleAPI.d.ts.map