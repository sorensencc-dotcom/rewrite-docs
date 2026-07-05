/**
 * WS-B Scenario B2: Latency Regression Gate
 * Injects p99 latency above SLO threshold, verifies abort + rollback
 */
export interface LatencyRegressionReport {
    startedAt: number;
    completedAt: number;
    abortTriggered: boolean;
    rollbackCompleted: boolean;
    rollbackMs: number | null;
}
export declare function runLatencyRegressionGate(): Promise<LatencyRegressionReport>;
//# sourceMappingURL=scenario-b-latency-regression.d.ts.map