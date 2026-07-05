/**
 * WS-B Canary-Gates:B Validation Runner
 * Executes all four canary gating scenarios (B1-B4) with unified reporting
 * Validates SLO enforcement, burn-rate detection, and rollback SLA compliance
 */
export interface ScenarioResult {
    name: string;
    passed: boolean;
    abortTriggered: boolean;
    rollbackCompleted: boolean;
    rollbackMs: number | null;
    violations: number;
    timestamp: number;
    error?: string;
}
export interface WSBReport {
    startedAt: number;
    completedAt: number;
    duration: number;
    scenarios: {
        B1: ScenarioResult;
        B2: ScenarioResult;
        B3: ScenarioResult;
        B4: ScenarioResult;
    };
    passCount: number;
    failCount: number;
    pass: boolean;
    criticalFailures: string[];
}
export declare function runWSBValidation(): Promise<WSBReport>;
export declare function formatWSBReport(report: WSBReport): string;
//# sourceMappingURL=wsb-runner.d.ts.map