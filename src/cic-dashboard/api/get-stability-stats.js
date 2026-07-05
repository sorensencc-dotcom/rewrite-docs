// src/cic-dashboard/api/get-stability-stats.ts
import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";
/**
 * API: Get stability stats for dashboard.
 */
export async function getStabilityStats(modelId) {
    const result = await pgQuery(`
    SELECT
      model_id,
      sandbox_tier,
      avg_drift_score,
      slo_violation_rate,
      sample_size,
      updated_at
    FROM cic_stability_stats
    ${modelId ? "WHERE model_id = $1" : ""}
    ORDER BY model_id, sandbox_tier
    `, modelId ? [modelId] : []);
    return result.rows;
}
//# sourceMappingURL=get-stability-stats.js.map