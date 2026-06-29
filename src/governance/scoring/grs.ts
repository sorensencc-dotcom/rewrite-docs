/**
 * Governance Risk Score (GRS) — Hybrid Formula
 * Phase 5: Adaptive governance layer
 * Linear when risk < T=0.30, exponential when risk ≥ T
 */

import { GovernanceConfig } from "../config/governance.config";

export interface GRSInputs {
  V: number; // violation rate [0, 1]
  R: number; // retry/rollback rate [0, 1]
  C: number; // cohort instability [0, 1]
  I: number; // impact drift [0, 1]
}

/**
 * Compute Governance Risk Score using hybrid formula.
 * Linear zone (stable): smooth behavior, human-auditable
 * Exponential zone (danger): sharp penalties, autonomous safety
 */
export function computeGRS(inputs: GRSInputs, config: GovernanceConfig): number {
  const weights = config.grsWeights ?? {
    w1: 0.40,
    w2: 0.20,
    w3: 0.20,
    w4: 0.20,
    k: 1.5,
  };

  // Linear combination (weighted sum)
  const linear = weights.w1 * inputs.V + weights.w2 * inputs.R + weights.w3 * inputs.C + weights.w4 * inputs.I;

  const T = config.hybridThreshold;

  // Regime switch at T
  if (linear < T) {
    return linear; // Linear zone: predictable
  }

  // Exponential zone: sharp safety cliffs
  return 1 - Math.exp(-weights.k * (inputs.V + inputs.R + inputs.C + inputs.I));
}

/**
 * Validate GRS inputs are in [0, 1] range.
 * Throws if any input is out of range.
 */
export function validateGRSInputs(inputs: GRSInputs): void {
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value !== "number" || value < 0 || value > 1) {
      throw new Error(`GRS input ${key}=${value} out of range [0, 1]`);
    }
  }
}

/**
 * Compute adaptive retry cap based on GRS.
 * max_retries = floor((1 - GRS) * config.retryCaps.maxRetries)
 * Allows 3 retries when GRS=0, collapses to 0 when GRS≥1
 */
export function computeAdaptiveRetryCap(grs: number, config: GovernanceConfig): number {
  return Math.floor((1 - Math.min(grs, 1)) * (config.retryCaps.maxRetries || 3));
}

/**
 * Compute rollback severity based on GRS.
 * Soft: GRS < 0.33 (easy rollback)
 * Structured: 0.33 ≤ GRS < 0.66 (careful rollback)
 * Hard: GRS ≥ 0.66 (aggressive rollback + lineage freeze)
 */
export function computeRollbackSeverity(grs: number): "rollback_soft" | "rollback_structured" | "rollback_hard" {
  if (grs < 0.33) return "rollback_soft";
  if (grs < 0.66) return "rollback_structured";
  return "rollback_hard";
}
