import { MetricsRegistry } from './self-healing-metrics';
export declare class PromMetricsRegistry implements MetricsRegistry {
    private failureEventsCounter;
    private repairAttemptsCounter;
    private escalationsCounter;
    private manualInterventionsCounter;
    private nodeRetriesCounter;
    private buildRetriesCounter;
    private anomalyScoresHistogram;
    constructor();
    get failureEvents(): {
        inc: (labels?: Record<string, string>, value?: number) => void;
    };
    get repairAttempts(): {
        inc: (labels?: Record<string, string>, value?: number) => void;
    };
    get escalations(): {
        inc: (labels?: Record<string, string>, value?: number) => void;
    };
    get manualInterventions(): {
        inc: (labels?: Record<string, string>, value?: number) => void;
    };
    get nodeRetries(): {
        inc: (labels?: Record<string, string>, value?: number) => void;
    };
    get buildRetries(): {
        inc: (labels?: Record<string, string>, value?: number) => void;
    };
    get anomalyScores(): {
        observe: (labels: Record<string, string>, value: number) => void;
    };
}
//# sourceMappingURL=prom-metrics.d.ts.map