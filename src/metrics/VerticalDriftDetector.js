import { logger } from "../lib/logger";
export class VerticalDriftDetector {
    driftThresholdWarning = 0.1;
    driftThresholdCritical = 0.2;
    hydrationDriftThreshold = 15;
    transientErrorThreshold = 0.2;
    wafBlockThreshold = 0.005;
    structuralDriftNodeCount = 0.25;
    structuralDriftTextDensity = 0.2;
    async detectDrift(vertical, current, baseline) {
        const currentSuccess = current.successCount / current.totalAttempts;
        const baselineSuccess = baseline.successCount / baseline.totalAttempts;
        const driftPercent = (baselineSuccess - currentSuccess) / baselineSuccess;
        logger.info("drift.calculate", {
            vertical,
            driftPercent,
            baselineSuccess,
            currentSuccess
        });
        // No drift if improvement or minimal change
        if (driftPercent <= -0.05) {
            return null;
        }
        if (driftPercent < this.driftThresholdWarning) {
            return null;
        }
        // Classify drift
        const classification = this.classifyDrift(current, baseline);
        const severity = this.calculateSeverity(driftPercent, classification);
        const recommendation = this.generateRecommendation(vertical, classification, current, baseline);
        const event = {
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
        };
        logger.info("drift.detected", {
            vertical,
            severity,
            driftPercent,
            classification
        });
        return event;
    }
    classifyDrift(current, baseline) {
        // Hydration drift
        const hydrationDelta = Math.abs(current.avgHydrationScore - baseline.avgHydrationScore);
        if (hydrationDelta >= this.hydrationDriftThreshold) {
            return "hydration";
        }
        // Transient error drift
        const currentTransientRate = (current.timeoutCount + current.navFailCount) / current.totalAttempts;
        const baselineTransientRate = (baseline.timeoutCount + baseline.navFailCount) / baseline.totalAttempts;
        const transientDelta = (currentTransientRate - baselineTransientRate) / baselineTransientRate;
        if (transientDelta >= this.transientErrorThreshold) {
            return "transient";
        }
        // WAF drift
        const currentWafRate = current.wafBlockCount / current.totalAttempts;
        if (currentWafRate > this.wafBlockThreshold) {
            return "waf";
        }
        // Structural drift
        const nodeCountDelta = Math.abs(current.avgNodeCount - baseline.avgNodeCount);
        const nodeCountDeltaPercent = nodeCountDelta / baseline.avgNodeCount;
        const textDensityDelta = Math.abs(current.avgTextDensity - baseline.avgTextDensity);
        const textDensityDeltaPercent = textDensityDelta / baseline.avgTextDensity;
        if (nodeCountDeltaPercent >= this.structuralDriftNodeCount ||
            textDensityDeltaPercent >= this.structuralDriftTextDensity) {
            return "structural";
        }
        return "unknown";
    }
    calculateSeverity(driftPercent, classification) {
        if (driftPercent >= this.driftThresholdCritical) {
            return "critical";
        }
        if (driftPercent >= this.driftThresholdWarning) {
            if (classification === "hydration" || classification === "waf") {
                return "warning";
            }
            return "info";
        }
        return "none";
    }
    extractDetails(current, baseline, classification) {
        const details = {};
        if (classification === "hydration") {
            details.hydration_baseline = baseline.avgHydrationScore;
            details.hydration_current = current.avgHydrationScore;
            details.delta = current.avgHydrationScore - baseline.avgHydrationScore;
        }
        else if (classification === "transient") {
            const currentRate = (current.timeoutCount + current.navFailCount) / current.totalAttempts;
            const baselineRate = (baseline.timeoutCount + baseline.navFailCount) / baseline.totalAttempts;
            details.transient_baseline = baselineRate;
            details.transient_current = currentRate;
            details.timeout_count = current.timeoutCount;
            details.nav_fail_count = current.navFailCount;
        }
        else if (classification === "waf") {
            details.waf_block_rate =
                current.wafBlockCount / current.totalAttempts;
            details.waf_block_count = current.wafBlockCount;
        }
        else if (classification === "structural") {
            details.node_count_baseline = baseline.avgNodeCount;
            details.node_count_current = current.avgNodeCount;
            details.text_density_baseline = baseline.avgTextDensity;
            details.text_density_current = current.avgTextDensity;
        }
        return details;
    }
    generateRecommendation(vertical, classification, current, baseline) {
        switch (classification) {
            case "hydration":
                return `Investigate SPA framework updates or client-side rendering changes for ${vertical}. Hydration score dropped from ${baseline.avgHydrationScore} to ${current.avgHydrationScore}.`;
            case "transient":
                return `Check network stability and server-side load for ${vertical}. Timeout/navigation failure rate increased. Consider increasing retry backoff or reducing concurrent loads.`;
            case "waf":
                return `WAF/rate limit blocks detected for ${vertical}. Review request headers, rate limits, or IP reputation. Consider implementing exponential backoff or request spreading.`;
            case "structural":
                return `Template or framework structure changed for ${vertical}. DOM node count or text density shifted significantly. Review site updates or CSS framework migrations.`;
            default:
                return `Investigate ingestion reliability drop for ${vertical}.`;
        }
    }
}
//# sourceMappingURL=VerticalDriftDetector.js.map