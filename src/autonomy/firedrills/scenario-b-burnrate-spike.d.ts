/**
 * Fire-Drill Scenario B: Burn-Rate Spike Detection
 * Injects 5x error rate spike, verifies abort + rollback < 300ms SLA
 * Part of D-Phase + E-Phase integration harness
 */
export interface FireDrillReport {
    startedAt: number;
    completedAt: number;
    abortTriggered: boolean;
    rollbackCompleted: boolean;
    rollbackMs: number | null;
    duration: number;
}
/**
 * Run burn-rate spike fire-drill
 * Injects 5x load, monitors for abort + rollback completion
 * SLA: rollback completes < 300ms
 */
export declare function runBurnRateSpikeFireDrill(): Promise<FireDrillReport>;
//# sourceMappingURL=scenario-b-burnrate-spike.d.ts.map