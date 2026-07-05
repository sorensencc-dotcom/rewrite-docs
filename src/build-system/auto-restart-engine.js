// src/build-system/auto-restart-engine.ts
export class AutoRestartEngine {
    config;
    constructor(config) {
        this.config = config;
    }
    decideRetry(state) {
        if (state.nodeRetryCount >= this.config.maxNodeRetries) {
            return {
                shouldRetry: false,
                delayMs: 0,
                reason: 'Node retry quota exceeded',
            };
        }
        if (state.buildRetryCount >= this.config.maxBuildRetries) {
            return {
                shouldRetry: false,
                delayMs: 0,
                reason: 'Build retry quota exceeded',
            };
        }
        const delayMs = this.computeBackoffDelay(state.nodeRetryCount);
        return {
            shouldRetry: true,
            delayMs,
            reason: 'Retry allowed by quotas',
        };
    }
    computeBackoffDelay(attemptIndex) {
        const { baseDelayMs, backoffFactor } = this.config;
        return baseDelayMs * Math.pow(backoffFactor, attemptIndex);
    }
}
//# sourceMappingURL=auto-restart-engine.js.map