// src/maal/router/sandbox-violation.ts
import sandboxConfig from "./sandbox.config.json";
import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";
/**
 * Escalate sandbox tier based on violation type.
 * Uses sandboxFallbackChain from sandbox.config.json.
 */
export async function handleSandboxViolation(run) {
    const currentTier = run.tierId;
    const nextTier = sandboxConfig.sandboxFallbackChain[currentTier];
    // No higher tier available → stay on current tier
    if (!nextTier) {
        await logSandboxDrift(run, currentTier, currentTier);
        return currentTier;
    }
    // Escalate to next tier
    await logSandboxDrift(run, currentTier, nextTier);
    return nextTier;
}
/**
 * Drift logging hook (Phase 5).
 * Ingests sandbox drift reports to sandbox_drift_log table.
 * Non-fatal: failures do not block canary execution.
 */
async function logSandboxDrift(run, fromTier, toTier) {
    try {
        const type = "sandbox_escalation";
        const violationType = run.violationType ?? "unknown";
        const driftScore = run.driftScore ?? 0.0;
        await pgQuery(`INSERT INTO sandbox_drift_log (type, from_tier, to_tier, violation_type, drift_score, recorded_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, [type, fromTier, toTier, violationType, driftScore]);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : "unknown error";
        console.error(`[sandbox-drift] non-fatal write failure:`, errorMsg);
        // Do not rethrow — lineage failures must not block canary execution
    }
}
//# sourceMappingURL=sandbox-violation.js.map