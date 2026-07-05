export interface ComparisonResult {
    model: string;
    prompt: string;
    response: string;
    latencyMs: number;
    tokens: number;
    error?: string;
    timestamp: string;
}
export interface ComparisonReport {
    runId: string;
    timestamp: string;
    models: string[];
    prompts: string[];
    results: ComparisonResult[];
    summary: {
        totalRuns: number;
        successCount: number;
        errorCount: number;
        avgLatencyMs: number;
        avgTokens: number;
    };
}
export interface ComparisonHarnessConfig {
    promptCount?: number;
    throttleMs?: number;
}
export declare class ComparisonHarness {
    private prompts;
    private config;
    constructor(config?: ComparisonHarnessConfig);
    runComparison(models: string[], prompts?: string[]): Promise<ComparisonReport>;
    private runSingleTest;
    saveReport(report: ComparisonReport, dir: string): Promise<{
        path: string;
        report: ComparisonReport;
    }>;
    getDefaultPrompts(): string[];
    setCustomPrompts(prompts: string[]): void;
}
//# sourceMappingURL=comparisonHarness.d.ts.map