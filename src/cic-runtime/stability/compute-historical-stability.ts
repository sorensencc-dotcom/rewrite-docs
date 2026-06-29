// src/cic-runtime/stability/compute-historical-stability.ts

import { pgQuery } from "../audit-log/postgres-client";

/**
 * Compute stability metrics for each (modelId, sandboxTier).
 * Writes results into cic_stability_stats.
 */
export async function computeHistoricalStability(): Promise<void> {
  // Pull aggregated stats from audit log
  const result = await pgQuery(`
    SELECT
      model_id,
      sandbox_tier,
      AVG(drift_score) AS avg_drift_score,
      AVG(
        CASE
          WHEN slo_latency_ok AND slo_isolation_ok AND slo_reliability_ok
          THEN 1 ELSE 0
        END
      ) AS avg_slo_success,
      COUNT(*) AS sample_size
    FROM cic_audit_log
    GROUP BY model_id, sandbox_tier
  `);

  const rows = result.rows;

  for (const row of rows) {
    const violationRate = 1 - Number(row.avg_slo_success);

    await pgQuery(
      `
      INSERT INTO cic_stability_stats (
        model_id,
        sandbox_tier,
        avg_drift_score,
        slo_violation_rate,
        sample_size,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (model_id, sandbox_tier)
      DO UPDATE SET
        avg_drift_score = EXCLUDED.avg_drift_score,
        slo_violation_rate = EXCLUDED.slo_violation_rate,
        sample_size = EXCLUDED.sample_size,
        updated_at = NOW()
      `,
      [
        row.model_id,
        row.sandbox_tier,
        row.avg_drift_score,
        violationRate,
        row.sample_size
      ]
    );
  }
}
