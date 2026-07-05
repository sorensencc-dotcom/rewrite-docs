/**
 * Governance Risk Score (GRS) — Hybrid Formula
 * Phase 5: Adaptive governance layer
 * Linear when risk < T=0.30, exponential when risk ≥ T
 */
import { GovernanceConfig } from "../config/governance.config";
export interface GRSInputs {
    V: number;
    R: number;
    C: number;
    I: number;
}
/**
 * Compute Governance Risk Score using hybrid formula.
 * Linear zone (stable): smooth behavior, human-auditable
 * Exponential zone (danger): sharp penalties, autonomous safety
 */
export declare function computeGRS(inputs: GRSInputs, config: GovernanceConfig): number;
/**
 * Validate GRS inputs are in [0, 1] range.
 * Throws if any input is out of range.
 */
export declare function validateGRSInputs(inputs: GRSInputs): void;
/**
 * Compute adaptive retry cap based on GRS.
 * max_retries = floor((1 - GRS) * config.retryCaps.maxRetries)
 * Allows 3 retries when GRS=0, collapses to 0 when GRS≥1
 */
export declare function computeAdaptiveRetryCap(grs: number, config: GovernanceConfig): number;
/**
 * Compute rollback severity based on GRS.
 * Soft: GRS < 0.33 (easy rollback)
 * Structured: 0.33 ≤ GRS < 0.66 (careful rollback)
 * Hard: GRS ≥ 0.66 (aggressive rollback + lineage freeze)
 */
export declare function computeRollbackSeverity(grs: number): "rollback_soft" | "rollback_structured" | "rollback_hard";
//# sourceMappingURL=grs.d.ts.map