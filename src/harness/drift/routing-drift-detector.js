/*
  filename: routing-drift-detector.ts
  version: 1.0.0
  updated: 2026-06-28
*/
import { selectRegime } from "../../routing/regimeSelector";
export async function detectRoutingDrift() {
    const fp = { task: "summarize", size: 128 };
    const r1 = selectRegime(fp);
    const r2 = selectRegime(fp);
    return {
        passed: r1 === r2,
    };
}
//# sourceMappingURL=routing-drift-detector.js.map