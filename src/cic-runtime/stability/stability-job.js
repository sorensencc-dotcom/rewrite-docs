// src/cic-runtime/stability/stability-job.ts
import { computeHistoricalStability } from "./compute-historical-stability";
/**
 * Stability job: runs every 5 minutes.
 * Updates cic_stability_stats table.
 */
export function startStabilityJob() {
    // Run immediately on startup
    computeHistoricalStability().catch(err => console.error("[CIC][StabilityJob] initial run failed:", err));
    // Schedule every 5 minutes
    setInterval(async () => {
        try {
            await computeHistoricalStability();
            console.log("[CIC][StabilityJob] updated stability stats");
        }
        catch (err) {
            console.error("[CIC][StabilityJob] update failed:", err);
        }
    }, 5 * 60 * 1000);
}
//# sourceMappingURL=stability-job.js.map