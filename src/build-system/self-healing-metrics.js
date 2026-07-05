// src/build-system/self-healing-metrics.ts
export class NoopMetricsRegistry {
    failureEvents = { inc: () => { } };
    repairAttempts = { inc: () => { } };
    escalations = { inc: () => { } };
    manualInterventions = { inc: () => { } };
    nodeRetries = { inc: () => { } };
    buildRetries = { inc: () => { } };
    anomalyScores = { observe: () => { } };
}
//# sourceMappingURL=self-healing-metrics.js.map