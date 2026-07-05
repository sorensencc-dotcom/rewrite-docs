export interface Counter {
    inc(labels?: Record<string, string>, value?: number): void;
}
export interface Gauge {
    set(labels: Record<string, string>, value: number): void;
}
export interface Histogram {
    observe(labels: Record<string, string>, value: number): void;
}
export interface MetricsRegistry {
    failureEvents: Counter;
    repairAttempts: Counter;
    escalations: Counter;
    manualInterventions: Counter;
    nodeRetries: Counter;
    buildRetries: Counter;
    anomalyScores: Histogram;
}
export declare class NoopMetricsRegistry implements MetricsRegistry {
    failureEvents: {
        inc: () => void;
    };
    repairAttempts: {
        inc: () => void;
    };
    escalations: {
        inc: () => void;
    };
    manualInterventions: {
        inc: () => void;
    };
    nodeRetries: {
        inc: () => void;
    };
    buildRetries: {
        inc: () => void;
    };
    anomalyScores: {
        observe: () => void;
    };
}
//# sourceMappingURL=self-healing-metrics.d.ts.map