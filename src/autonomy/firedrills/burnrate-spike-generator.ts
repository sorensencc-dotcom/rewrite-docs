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

const defaultConfig: SpikeConfig = {
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
export async function generateBurnRateSpike(
  setMetrics: MetricsCallback,
  config: Partial<SpikeConfig> = {}
): Promise<void> {
  const {
    baseErrorRate,
    spikeMultiplier,
    windows,
    holdTimeMs,
    rampDownMs,
  } = {
    ...defaultConfig,
    ...config,
  };

  // 1. Baseline metrics
  const baseline: Record<string, number> = {};
  for (const w of windows) {
    baseline[`slo_error_rate_${w}`] = baseErrorRate;
  }
  setMetrics(baseline);

  // 2. Stabilize
  await sleep(1000);

  // 3. Apply spike
  const spike: Record<string, number> = {};
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
