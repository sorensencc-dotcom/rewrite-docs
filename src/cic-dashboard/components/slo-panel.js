// src/cic-dashboard/components/slo-panel.ts
import { getStabilityStats } from "../api/get-stability-stats";
/**
 * SLOPanel: renders SLO violation rates per sandbox tier.
 */
export async function SLOPanel(modelId) {
    const stats = await getStabilityStats(modelId);
    return `
    <div class="panel slo-panel">
      <h2>SLO Violation Rates</h2>
      ${stats
        .map(row => `
        <div class="slo-row">
          <h3>${row.sandbox_tier}</h3>
          <p>Violation Rate: ${(row.slo_violation_rate * 100).toFixed(2)}%</p>
          <p>Sample Size: ${row.sample_size}</p>
        </div>
      `)
        .join("")}
    </div>
  `;
}
//# sourceMappingURL=slo-panel.js.map