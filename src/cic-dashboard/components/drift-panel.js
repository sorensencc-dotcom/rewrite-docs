// src/cic-dashboard/components/drift-panel.ts
import { getStabilityStats } from "../api/get-stability-stats";
/**
 * DriftPanel: renders drift score trends for each sandbox tier.
 */
export async function DriftPanel(modelId) {
    const stats = await getStabilityStats(modelId);
    const grouped = {};
    for (const row of stats) {
        if (!grouped[row.sandbox_tier])
            grouped[row.sandbox_tier] = [];
        grouped[row.sandbox_tier].push(row.avg_drift_score);
    }
    return `
    <div class="panel drift-panel">
      <h2>Drift Score Trends</h2>
      ${Object.entries(grouped)
        .map(([tier, scores]) => `
        <div class="tier-block">
          <h3>${tier}</h3>
          <p>Recent Drift Scores: ${scores.map(s => s.toFixed(3)).join(", ")}</p>
        </div>
      `)
        .join("")}
    </div>
  `;
}
//# sourceMappingURL=drift-panel.js.map