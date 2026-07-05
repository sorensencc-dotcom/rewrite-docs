import { CacheMetrics } from "./cache-types";
export declare class CacheMetricsCollector {
    private metrics;
    recordL1Hit(): void;
    recordL2Hit(): void;
    recordProviderHit(): void;
    recordOfflineHit(): void;
    recordEviction(): void;
    recordDiskWrite(): void;
    recordDiskRead(): void;
    recordError(): void;
    getMetrics(): CacheMetrics;
    getHitRate(): number;
    reset(): void;
    summarize(): string;
}
//# sourceMappingURL=cache-metrics.d.ts.map