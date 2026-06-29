/**
 * Gate B — Adaptive Canary Governance
 * Phase 5: Hybrid GRS computation, violation classification, adaptive retry/rollback
 * This gate runs during canary execution
 */

import { GovernanceVerdictV2, ViolationClass } from "../models";
import { computeGRS, computeAdaptiveRetryCap, computeRollbackSeverity, GRSInputs } from "../scoring/grs";
import { governanceCache } from "../config/governance-cache";

export interface AdaptiveCanaryGateInput {
  proposalId: string;
  grsInputs: GRSInputs;
  violationCount: number;
  retryCount: number;
}

/**
 * Adaptive canary gate: computes GRS, classifies violations, determines retry/rollback behavior.
 * Adaptive behavior based on risk score.
 */
export async function gateBAdaptiveCanaryCheck(input: AdaptiveCanaryGateInput): Promise<GovernanceVerdictV2> {
  const config = governanceCache.get();

  // Compute GRS
  const grs = computeGRS(input.grsInputs, config);

  // Classify violations
  const violationClass = classifyViolationFromGRS(grs);

  // Compute adaptive retry cap
  const maxRetries = computeAdaptiveRetryCap(grs, config);
  const canRetry = input.retryCount < maxRetries;

  // Compute rollback severity
  const rollbackSeverity = computeRollbackSeverity(grs);

  // Determine verdict
  let verdict: "PASS" | "WARN" | "FAIL" = "PASS";
  let reason = `Canary active: GRS=${grs.toFixed(2)}, violations=${input.violationCount}, retries=${input.retryCount}/${maxRetries}`;

  if (!canRetry && input.violationCount > 0) {
    verdict = "FAIL";
    reason = `Canary failing: max retries exhausted, GRS=${grs.toFixed(2)}`;
  } else if (input.violationCount > config.violationCaps.maxHardStructural && violationClass.startsWith("hard")) {
    verdict = "WARN";
    reason = `Hard violation detected: ${violationClass}, GRS=${grs.toFixed(2)}`;
  }

  return {
    verdict,
    governance_reason: reason,
    governance_path: "gate_b",
    risk_score: grs,
  };
}

function classifyViolationFromGRS(grs: number): ViolationClass {
  if (grs < 0.25) return "soft_violation_minor";
  if (grs < 0.5) return "soft_violation_major";
  if (grs < 0.75) return "hard_violation_structural";
  return "hard_violation_runtime";
}
