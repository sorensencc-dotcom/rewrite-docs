import { logger } from "../lib/logger"

export type DriftClassification =
  | "hydration"
  | "transient"
  | "waf"
  | "structural"
  | "unknown"

export type DriftSeverity = "critical" | "warning" | "info" | "none"

export interface VerticalMetrics {
  vertical: string
  successCount: number
  failureCount: number
  timeoutCount: number
  navFailCount: number
  jsFailCount: number
  wafBlockCount: number
  avgHydrationScore: number
  avgNodeCount: number
  avgTextDensity: number
  totalAttempts: number
}

export interface DriftEvent {
  event: string
  vertical: string
  driftPercent: number
  baselineSuccess: number
  currentSuccess: number
  classification: DriftClassification
  details: Record<string, unknown>
  severity: DriftSeverity
  timestamp: number
  recommendation: string
}

export class VerticalDriftDetector {
  private driftThresholdWarning = 0.1
  private driftThresholdCritical = 0.2
  private hydrationDriftThreshold = 15
  private transientErrorThreshold = 0.2
  private wafBlockThreshold = 0.005
  private structuralDriftNodeCount = 0.25
  private structuralDriftTextDensity = 0.2

  async detectDrift(
    vertical: string,
    current: VerticalMetrics,
    baseline: VerticalMetrics
  ): Promise<DriftEvent | null> {
    const currentSuccess = current.successCount / current.totalAttempts
    const baselineSuccess = baseline.successCount / baseline.totalAttempts

    const driftPercent =
      (baselineSuccess - currentSuccess) / baselineSuccess

    logger.info("drift.calculate", {
      vertical,
      driftPercent,
      baselineSuccess,
      currentSuccess
    })

    // No drift if improvement or minimal change
    if (driftPercent <= -0.05) {
      return null
    }

    if (driftPercent < this.driftThresholdWarning) {
      return null
    }

    // Classify drift
    const classification = this.classifyDrift(current, baseline)
    const severity = this.calculateSeverity(driftPercent, classification)
    const recommendation = this.generateRecommendation(
      vertical,
      classification,
      current,
      baseline
    )

    const event: DriftEvent = {
      event: "vertical.drift",
      vertical,
      driftPercent,
      baselineSuccess,
      currentSuccess,
      classification,
      details: this.extractDetails(current, baseline, classification),
      severity,
      timestamp: Date.now(),
      recommendation
    }

    logger.info("drift.detected", {
      vertical,
      severity,
      driftPercent,
      classification
    })

    return event
  }

  private classifyDrift(
    current: VerticalMetrics,
    baseline: VerticalMetrics
  ): DriftClassification {
    // Hydration drift
    const hydrationDelta = Math.abs(
      current.avgHydrationScore - baseline.avgHydrationScore
    )
    if (hydrationDelta >= this.hydrationDriftThreshold) {
      return "hydration"
    }

    // Transient error drift
    const currentTransientRate =
      (current.timeoutCount + current.navFailCount) / current.totalAttempts
    const baselineTransientRate =
      (baseline.timeoutCount + baseline.navFailCount) / baseline.totalAttempts
    const transientDelta =
      (currentTransientRate - baselineTransientRate) / baselineTransientRate

    if (transientDelta >= this.transientErrorThreshold) {
      return "transient"
    }

    // WAF drift
    const currentWafRate = current.wafBlockCount / current.totalAttempts
    if (currentWafRate > this.wafBlockThreshold) {
      return "waf"
    }

    // Structural drift
    const nodeCountDelta = Math.abs(
      current.avgNodeCount - baseline.avgNodeCount
    )
    const nodeCountDeltaPercent = nodeCountDelta / baseline.avgNodeCount

    const textDensityDelta = Math.abs(
      current.avgTextDensity - baseline.avgTextDensity
    )
    const textDensityDeltaPercent =
      textDensityDelta / baseline.avgTextDensity

    if (
      nodeCountDeltaPercent >= this.structuralDriftNodeCount ||
      textDensityDeltaPercent >= this.structuralDriftTextDensity
    ) {
      return "structural"
    }

    return "unknown"
  }

  private calculateSeverity(
    driftPercent: number,
    classification: DriftClassification
  ): DriftSeverity {
    if (driftPercent >= this.driftThresholdCritical) {
      return "critical"
    }

    if (driftPercent >= this.driftThresholdWarning) {
      if (classification === "hydration" || classification === "waf") {
        return "warning"
      }
      return "info"
    }

    return "none"
  }

  private extractDetails(
    current: VerticalMetrics,
    baseline: VerticalMetrics,
    classification: DriftClassification
  ): Record<string, unknown> {
    const details: Record<string, unknown> = {}

    if (classification === "hydration") {
      details.hydration_baseline = baseline.avgHydrationScore
      details.hydration_current = current.avgHydrationScore
      details.delta = current.avgHydrationScore - baseline.avgHydrationScore
    } else if (classification === "transient") {
      const currentRate =
        (current.timeoutCount + current.navFailCount) / current.totalAttempts
      const baselineRate =
        (baseline.timeoutCount + baseline.navFailCount) / baseline.totalAttempts
      details.transient_baseline = baselineRate
      details.transient_current = currentRate
      details.timeout_count = current.timeoutCount
      details.nav_fail_count = current.navFailCount
    } else if (classification === "waf") {
      details.waf_block_rate =
        current.wafBlockCount / current.totalAttempts
      details.waf_block_count = current.wafBlockCount
    } else if (classification === "structural") {
      details.node_count_baseline = baseline.avgNodeCount
      details.node_count_current = current.avgNodeCount
      details.text_density_baseline = baseline.avgTextDensity
      details.text_density_current = current.avgTextDensity
    }

    return details
  }

  private generateRecommendation(
    vertical: string,
    classification: DriftClassification,
    current: VerticalMetrics,
    baseline: VerticalMetrics
  ): string {
    switch (classification) {
      case "hydration":
        return `Investigate SPA framework updates or client-side rendering changes for ${vertical}. Hydration score dropped from ${baseline.avgHydrationScore} to ${current.avgHydrationScore}.`

      case "transient":
        return `Check network stability and server-side load for ${vertical}. Timeout/navigation failure rate increased. Consider increasing retry backoff or reducing concurrent loads.`

      case "waf":
        return `WAF/rate limit blocks detected for ${vertical}. Review request headers, rate limits, or IP reputation. Consider implementing exponential backoff or request spreading.`

      case "structural":
        return `Template or framework structure changed for ${vertical}. DOM node count or text density shifted significantly. Review site updates or CSS framework migrations.`

      default:
        return `Investigate ingestion reliability drop for ${vertical}.`
    }
  }
}
