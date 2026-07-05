// src/cic-dashboard/components/stability-panel.ts
import { getStabilityStats } from "../api/get-stability-stats";
/**
 * StabilityPanel: renders combined stability score.
 * StabilityScore = (1 - violationRate) * (1 - normalizedDrift)
 */
export async function StabilityPanel(modelId) {
    const stats = await getStabilityStats(modelId);
    const rows = stats.map(row => {
        const normalizedDrift = Math.min(row.avg_drift_score / 2, 1); // drift ∈ [0,2]
        const stabilityScore = (1 - row.slo_violation_rate) * (1 - normalizedDrift);
        return {
            tier: row.sandbox_tier,
            stabilityScore,
            drift: row.avg_drift_score,
            violationRate: row.slo_violation_rate
        };
    });
    return `
    <div class="panel stability-panel">
      <h2>Stability Score</h2>
      ${rows
        .map(r => `
        <div class="stability-row">
          <h3>${r.tier}</h3>
          <p>Stability Score: ${r.stabilityScore.toFixed(3)}</p>
          <p>Avg Drift: ${r.drift.toFixed(3)}</p>
          <p>Violation Rate: ${(r.violationRate * 100).toFixed(2)}%</p>
        </div>
      `)
        .join("")}
    </div>
  `;
}
//# sourceMappingURL=stability-panel.js.map