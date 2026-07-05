/**
 * Structured logger for CIC observability
 * Stub implementation for Phase 2
 */
export interface LogContext {
    [key: string]: unknown;
}
export interface Logger {
    info(event: string, context?: LogContext): void;
    warn(event: string, context?: LogContext): void;
    error(event: string, context?: LogContext): void;
    debug(event: string, context?: LogContext): void;
}
declare class CICLogger implements Logger {
    info(event: string, context?: LogContext): void;
    warn(event: string, context?: LogContext): void;
    error(event: string, context?: LogContext): void;
    debug(event: string, context?: LogContext): void;
}
export declare const logger: CICLogger;
export {};
//# sourceMappingURL=logger.d.ts.map