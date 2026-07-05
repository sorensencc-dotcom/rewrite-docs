/**
 * WS-B Scenario B4: Saturation Gate
 * Injects CPU/Memory/Queue saturation, verifies abort + rollback
 */
export interface SaturationGateReport {
    startedAt: number;
    completedAt: number;
    abortTriggered: boolean;
    rollbackCompleted: boolean;
    rollbackMs: number | null;
}
export declare function runSaturationGate(): Promise<SaturationGateReport>;
//# sourceMappingURL=scenario-b-saturation.d.ts.map