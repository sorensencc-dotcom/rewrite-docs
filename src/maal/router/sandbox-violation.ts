// src/maal/router/sandbox-violation.ts

import sandboxConfig from "./sandbox.config.json";
import { SandboxTierId } from "../../cic/types/run-manifest";

/**
 * Sandbox violation types reported by the execution harness.
 */
export interface SandboxRunResult {
  tierId: SandboxTierId;
  violationType?: "resource" | "isolation" | "determinism" | "unknown";
}

/**
 * Escalate sandbox tier based on violation type.
 * Uses sandboxFallbackChain from sandbox.config.json.
 */
export function handleSandboxViolation(
  run: SandboxRunResult
): SandboxTierId {
  const currentTier = run.tierId;
  const nextTier = sandboxConfig.sandboxFallbackChain[currentTier];

  // No higher tier available → stay on current tier
  if (!nextTier) {
    logSandboxDrift(run, currentTier, currentTier);
    return currentTier;
  }

  // Escalate to next tier
  logSandboxDrift(run, currentTier, nextTier as SandboxTierId);
  return nextTier as SandboxTierId;
}

/**
 * Drift logging hook.
 * CIC will wire this into the audit log + stability metrics.
 */
function logSandboxDrift(
  run: SandboxRunResult,
  fromTier: SandboxTierId,
  toTier: SandboxTierId
): void {
  // Stub: CIC will implement actual logging.
  // This function intentionally does not throw or return anything.
  // It simply emits a structured event for the audit log.
  const event = {
    type: "sandbox_escalation",
    fromTier,
    toTier,
    violationType: run.violationType ?? "unknown",
    timestamp: new Date().toISOString()
  };

  // In Phase Sandbox‑1, we only console.log.
  // CIC Phase Sandbox‑2 will replace this with DB ingestion.
  console.log("[CIC][SandboxViolation]", JSON.stringify(event));
}
