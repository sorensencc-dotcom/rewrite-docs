/**
 * Fire-Drill Manager: D-Phase Integration
 * Runs resilience tests against MAAL routing layer
 * Reports violations to SLO controller + governance layer
 */
import { FireDrillResult } from "../../../src/tests/d-phase/fire-drill-harness.js";
export interface FireDrillConfig {
    enabled: boolean;
    runOnStartup?: boolean;
    runOnInterval?: number;
    failureThreshold?: number;
    reportToSLO?: boolean;
}
export interface FireDrillReport {
    timestamp: Date;
    totalDrills: number;
    passedDrills: number;
    failedDrills: number;
    passRate: string;
    violations: FireDrillResult[];
    healthy: boolean;
}
export declare class FireDrillManager {
    private config;
    private harness;
    private lastReport;
    private intervalHandle;
    constructor(config?: FireDrillConfig);
    runDrills(): Promise<FireDrillReport>;
    startSchedule(intervalMs: number): void;
    stopSchedule(): void;
    getLastReport(): FireDrillReport | null;
    isHealthy(): boolean;
}
//# sourceMappingURL=FireDrillManager.d.ts.map