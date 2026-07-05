// src/build-system/failure-detector.ts
export class FailureDetector {
    config;
    constructor(config) {
        this.config = config;
    }
    detectTimeout(ctx, endTime) {
        const durationMs = endTime - ctx.startTime;
        if (durationMs <= ctx.timeoutMs * this.config.timeoutThresholdFactor) {
            return null;
        }
        const metrics = { durationMs };
        const anomalyScore = this.computeAnomalyScore(metrics);
        const confidence = 0.9;
        return {
            buildId: ctx.buildId,
            nodeId: ctx.nodeId,
            category: 'TIMEOUT',
            anomalyScore,
            confidence,
            metrics,
            timestamp: new Date().toISOString(),
            message: `Node ${ctx.nodeId} exceeded timeout (${durationMs}ms > ${ctx.timeoutMs}ms)`,
        };
    }
    detectCrash(ctx, error, metrics = {}) {
        const anomalyScore = Math.max(100, this.computeAnomalyScore(metrics));
        const confidence = 0.95;
        let category = 'CRASH';
        if (error.message.toLowerCase().includes('cuda out of memory')) {
            category = 'GPU_OOM';
        }
        else if (error.message.toLowerCase().includes('out of memory')) {
            category = 'OOM';
        }
        return {
            buildId: ctx.buildId,
            nodeId: ctx.nodeId,
            category,
            anomalyScore,
            confidence,
            metrics,
            timestamp: new Date().toISOString(),
            message: `Node ${ctx.nodeId} crashed: ${error.message}`,
        };
    }
    detectDrift(ctx, expectedHash, actualHash) {
        if (expectedHash === actualHash)
            return null;
        const metrics = { expectedHash, actualHash };
        const anomalyScore = this.computeAnomalyScore(metrics);
        const confidence = 0.9;
        return {
            buildId: ctx.buildId,
            nodeId: ctx.nodeId,
            category: 'DRIFT',
            anomalyScore,
            confidence,
            metrics,
            timestamp: new Date().toISOString(),
            message: `Output drift detected for node ${ctx.nodeId}`,
        };
    }
    computeAnomalyScore(metrics) {
        const weights = this.config.anomalyScoreWeights;
        let score = 0;
        for (const key of Object.keys(weights)) {
            const weight = weights[key] ?? 0;
            const value = metrics[key];
            if (typeof value === 'number') {
                score += weight * this.normalizeMetric(value);
            }
        }
        return Math.min(100, Math.max(0, score));
    }
    normalizeMetric(value) {
        // Placeholder: plug in z-score or domain-specific normalization later
        return (Math.min(10, value) / 10) * 100;
    }
}
//# sourceMappingURL=failure-detector.js.map