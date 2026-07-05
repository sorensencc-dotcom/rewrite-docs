/**
 * PHASE 27.3 — Adapter Structured Logger
 * JSON format for observability stack integration
 * Emits to stdout for collection by Prometheus/ELK
 */
export interface AdapterLogContext {
    timestamp?: string;
    level: 'info' | 'warn' | 'error';
    component: string;
    adapter?: string;
    action: 'call' | 'validate' | 'guard' | 'envelope';
    status: 'success' | 'error';
    durationMs?: number;
    errorCode?: string;
    errorDetails?: Record<string, unknown>;
    meta?: {
        adapter?: string;
        timestamp?: string;
        durationMs?: number;
    };
}
declare class AdapterLoggerImpl {
    private logger;
    constructor();
    info(context: Omit<AdapterLogContext, 'level'>): void;
    warn(context: Omit<AdapterLogContext, 'level'>): void;
    error(context: Omit<AdapterLogContext, 'level'>): void;
    debug(context: Omit<AdapterLogContext, 'level'>): void;
}
export declare const adapterLogger: AdapterLoggerImpl;
export {};
//# sourceMappingURL=AdapterLogger.d.ts.map