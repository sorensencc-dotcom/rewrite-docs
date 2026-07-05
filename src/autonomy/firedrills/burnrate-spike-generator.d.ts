/**
 * Burn-Rate Spike Generator
 * Simulates 5x error rate spike for fire-drill testing
 * Feeds synthetic metrics to SLO controller
 */
export type MetricsCallback = (metrics: Record<string, number>) => void;
export interface SpikeConfig {
    baseErrorRate: number;
    spikeMultiplier: number;
    windows: ("1m" | "5m" | "30m")[];
    holdTimeMs: number;
    rampDownMs: number;
}
/**
 * Generate synthetic burn-rate spike
 * 1. Set baseline metrics
 * 2. Apply 5x multiplier
 * 3. Hold for N seconds
 * 4. Ramp down to baseline
 */
export declare function generateBurnRateSpike(setMetrics: MetricsCallback, config?: Partial<SpikeConfig>): Promise<void>;
//# sourceMappingURL=burnrate-spike-generator.d.ts.map