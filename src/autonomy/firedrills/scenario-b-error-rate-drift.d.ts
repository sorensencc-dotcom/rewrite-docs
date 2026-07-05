/**
 * WS-B Scenario B3: Error-Rate Drift Gate
 * Injects long-window error-rate above SLO, verifies abort + rollback
 */
export interface ErrorRateDriftReport {
    startedAt: number;
    completedAt: number;
    abortTriggered: boolean;
    rollbackCompleted: boolean;
    rollbackMs: number | null;
}
export declare function runErrorRateDriftGate(): Promise<ErrorRateDriftReport>;
//# sourceMappingURL=scenario-b-error-rate-drift.d.ts.map