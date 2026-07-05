export interface RetryConfig {
    maxNodeRetries: number;
    maxBuildRetries: number;
    baseDelayMs: number;
    backoffFactor: number;
}
export interface RetryState {
    nodeRetryCount: number;
    buildRetryCount: number;
}
export interface RetryDecision {
    shouldRetry: boolean;
    delayMs: number;
    reason: string;
}
export declare class AutoRestartEngine {
    private readonly config;
    constructor(config: RetryConfig);
    decideRetry(state: RetryState): RetryDecision;
    private computeBackoffDelay;
}
//# sourceMappingURL=auto-restart-engine.d.ts.map