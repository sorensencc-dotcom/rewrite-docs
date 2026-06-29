// src/maal/router/sandbox-violation.ts

import sandboxConfig from "./sandbox.config.json";
import { SandboxTierId } from "../../cic/types/run-manifest";
import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";

/**
 * Sandbox violation types reported by the execution harness.
 */
export interface SandboxRunResult {
  tierId: SandboxTierId;
  violationType?: "resource" | "isolation" | "determinism" | "unknown";
  driftScore?: number;
}

/**
 * Escalate sandbox tier based on violation type.
 * Uses sandboxFallbackChain from sandbox.config.json.
 */
export async function handleSandboxViolation(
  run: SandboxRunResult
): Promise<SandboxTierId> {
  const currentTier = run.tierId;
  const nextTier = sandboxConfig.sandboxFallbackChain[currentTier];

  // No higher tier available → stay on current tier
  if (!nextTier) {
    await logSandboxDrift(run, currentTier, currentTier);
    return currentTier;
  }

  // Escalate to next tier
  await logSandboxDrift(run, currentTier, nextTier as SandboxTierId);
  return nextTier as SandboxTierId;
}

/**
 * Drift logging hook (Phase 5).
 * Ingests sandbox drift reports to sandbox_drift_log table.
 * Non-fatal: failures do not block canary execution.
 */
async function logSandboxDrift(
  run: SandboxRunResult,
  fromTier: SandboxTierId,
  toTier: SandboxTierId
): Promise<void> {
  try {
    const type = "sandbox_escalation";
    const violationType = run.violationType ?? "unknown";
    const driftScore = run.driftScore ?? 0.0;

    await pgQuery(
      `INSERT INTO sandbox_drift_log (type, from_tier, to_tier, violation_type, drift_score, recorded_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [type, fromTier, toTier, violationType, driftScore]
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "unknown error";
    console.error(`[sandbox-drift] non-fatal write failure:`, errorMsg);
    // Do not rethrow — lineage failures must not block canary execution
  }
}
