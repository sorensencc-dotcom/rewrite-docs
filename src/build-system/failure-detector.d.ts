export type FailureCategory = 'TIMEOUT' | 'CRASH' | 'DRIFT' | 'OOM' | 'GPU_OOM' | 'RESOURCE_SPIKE';
export interface FailureMetrics {
    durationMs?: number;
    cpuPercent?: number;
    memoryBytes?: number;
    gpuMemoryBytes?: number;
    ioWaitPercent?: number;
    expectedHash?: string;
    actualHash?: string;
}
export interface FailureEvent {
    buildId: string;
    nodeId: string;
    category: FailureCategory;
    anomalyScore: number;
    confidence: number;
    metrics: FailureMetrics;
    timestamp: string;
    message?: string;
}
export interface ExecutionContext {
    buildId: string;
    nodeId: string;
    startTime: number;
    timeoutMs: number;
    expectedHash?: string;
}
export interface FailureDetectorConfig {
    timeoutThresholdFactor: number;
    anomalyScoreWeights: Partial<Record<keyof FailureMetrics, number>>;
}
export declare class FailureDetector {
    private readonly config;
    constructor(config: FailureDetectorConfig);
    detectTimeout(ctx: ExecutionContext, endTime: number): FailureEvent | null;
    detectCrash(ctx: ExecutionContext, error: Error, metrics?: Partial<FailureMetrics>): FailureEvent;
    detectDrift(ctx: ExecutionContext, expectedHash: string, actualHash: string): FailureEvent | null;
    private computeAnomalyScore;
    private normalizeMetric;
}
//# sourceMappingURL=failure-detector.d.ts.map