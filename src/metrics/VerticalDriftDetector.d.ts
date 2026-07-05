export type DriftClassification = "hydration" | "transient" | "waf" | "structural" | "unknown";
export type DriftSeverity = "critical" | "warning" | "info" | "none";
export interface VerticalMetrics {
    vertical: string;
    successCount: number;
    failureCount: number;
    timeoutCount: number;
    navFailCount: number;
    jsFailCount: number;
    wafBlockCount: number;
    avgHydrationScore: number;
    avgNodeCount: number;
    avgTextDensity: number;
    totalAttempts: number;
}
export interface DriftEvent {
    event: string;
    vertical: string;
    driftPercent: number;
    baselineSuccess: number;
    currentSuccess: number;
    classification: DriftClassification;
    details: Record<string, unknown>;
    severity: DriftSeverity;
    timestamp: number;
    recommendation: string;
}
export declare class VerticalDriftDetector {
    private driftThresholdWarning;
    private driftThresholdCritical;
    private hydrationDriftThreshold;
    private transientErrorThreshold;
    private wafBlockThreshold;
    private structuralDriftNodeCount;
    private structuralDriftTextDensity;
    detectDrift(vertical: string, current: VerticalMetrics, baseline: VerticalMetrics): Promise<DriftEvent | null>;
    private classifyDrift;
    private calculateSeverity;
    private extractDetails;
    private generateRecommendation;
}
//# sourceMappingURL=VerticalDriftDetector.d.ts.map