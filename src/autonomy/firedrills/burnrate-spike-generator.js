/**
 * Burn-Rate Spike Generator
 * Simulates 5x error rate spike for fire-drill testing
 * Feeds synthetic metrics to SLO controller
 */
const defaultConfig = {
    baseErrorRate: 0.001,
    spikeMultiplier: 10,
    windows: ["1m", "5m", "30m"],
    holdTimeMs: 4000,
    rampDownMs: 2000,
};
/**
 * Generate synthetic burn-rate spike
 * 1. Set baseline metrics
 * 2. Apply 5x multiplier
 * 3. Hold for N seconds
 * 4. Ramp down to baseline
 */
export async function generateBurnRateSpike(setMetrics, config = {}) {
    const { baseErrorRate, spikeMultiplier, windows, holdTimeMs, rampDownMs, } = {
        ...defaultConfig,
        ...config,
    };
    // 1. Baseline metrics
    const baseline = {};
    for (const w of windows) {
        baseline[`slo_error_rate_${w}`] = baseErrorRate;
    }
    setMetrics(baseline);
    // 2. Stabilize
    await sleep(1000);
    // 3. Apply spike
    const spike = {};
    for (const w of windows) {
        spike[`slo_error_rate_${w}`] = baseErrorRate * spikeMultiplier;
    }
    setMetrics(spike);
    // 4. Hold spike
    await sleep(holdTimeMs);
    // 5. Ramp down to baseline
    await sleep(rampDownMs);
    setMetrics(baseline);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=burnrate-spike-generator.js.map