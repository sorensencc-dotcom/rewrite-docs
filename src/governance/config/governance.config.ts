/**
 * Unified GovernanceConfig (Phase 5)
 * Single source of truth for all governance parameters.
 * Merges AuditConfig + GovernanceRouterConfig + Phase 5 adaptive governance fields.
 */

export interface GovernanceConfig {
  // Audit stage settings (from AuditConfig)
  cache_ttl_days: number;
  cache_enabled: boolean;
  deterministic_timeout_ms: number;
  semantic_audit_profiles: {
    fast: string;
    strict: string;
  };
  semantic_audit_timeout_ms: number;
  default_reaudit_interval_days: number;
  critical_reaudit_interval_days: number;
  policy_version: string;

  // Router settings (from GovernanceRouterConfig)
  governanceControlPlaneUrl: string;

  // Phase 5 adaptive governance
  hybridThreshold: number;                    // default 0.30
  hybridThresholdSource: 'operator';          // Phase 6 adds 'analytics'
  grsWeights?: {                              // configurable for Phase 6 tuning
    w1: number;  // violation rate weight    (default 0.40)
    w2: number;  // retry/rollback rate      (default 0.20)
    w3: number;  // cohort instability       (default 0.20)
    w4: number;  // impact drift             (default 0.20)
    k:  number;  // exponential steepness    (default 1.5)
  };
  violationCaps: {
    maxSoftMinor: number;         // default 5
    maxSoftMajor: number;         // default 2
    maxHardStructural: number;    // default 0
    maxHardRuntime: number;       // default 1
  };
  promotionCaps: {
    maxGRS: number;               // default 0.70
    maxImpactScore: number;       // default 0.60
    requiresLCSPerfect: boolean;  // default true
  };
  retryCaps: {
    maxRetries: number;           // default 3
  };
  lineageCaps: {
    maxDepth: number;             // default 50
  };
}

export class GovernanceConfigLoader {
  static load(): GovernanceConfig {
    // Audit config
    const cache_ttl_days = parseInt(process.env.AUDIT_CACHE_TTL_DAYS || "7", 10);
    const cache_enabled = process.env.AUDIT_CACHE_ENABLED !== "false";
    const deterministic_timeout_ms = parseInt(process.env.DETERMINISTIC_TIMEOUT_MS || "1000", 10);
    const semantic_audit_profiles = {
      fast: process.env.SEMANTIC_AUDIT_MODEL_FAST || "claude-haiku-4-5",
      strict: process.env.SEMANTIC_AUDIT_MODEL_STRICT || "claude-opus-4-8",
    };
    const semantic_audit_timeout_ms = parseInt(process.env.SEMANTIC_AUDIT_TIMEOUT_MS || "30000", 10);
    const default_reaudit_interval_days = parseInt(process.env.DEFAULT_REAUDIT_INTERVAL_DAYS || "90", 10);
    const critical_reaudit_interval_days = parseInt(process.env.CRITICAL_REAUDIT_INTERVAL_DAYS || "30", 10);
    const policy_version = process.env.POLICY_VERSION || "2.0";

    // Router config
    const governanceControlPlaneUrl = process.env.GOVERNANCE_URL || "http://localhost:3113";

    // Phase 5 adaptive governance
    const hybridThreshold = this.parseFloatWithValidation(
      process.env.HYBRID_THRESHOLD || "0.30",
      0.30,
      0.20,
      0.40
    );
    const hybridThresholdSource = "operator"; // Phase 6 will add 'analytics' support

    // GRS weights (optional, defaults applied in computeGRS)
    const grsWeights = process.env.GRS_WEIGHTS
      ? JSON.parse(process.env.GRS_WEIGHTS)
      : undefined;

    // Violation caps
    const violationCaps = {
      maxSoftMinor: parseInt(process.env.VIOLATION_CAP_SOFT_MINOR || "5", 10),
      maxSoftMajor: parseInt(process.env.VIOLATION_CAP_SOFT_MAJOR || "2", 10),
      maxHardStructural: parseInt(process.env.VIOLATION_CAP_HARD_STRUCTURAL || "0", 10),
      maxHardRuntime: parseInt(process.env.VIOLATION_CAP_HARD_RUNTIME || "1", 10),
    };

    // Promotion caps
    const promotionCaps = {
      maxGRS: this.parseFloatWithValidation(
        process.env.PROMOTION_CAP_MAX_GRS || "0.70",
        0.70,
        0.0,
        1.0
      ),
      maxImpactScore: this.parseFloatWithValidation(
        process.env.PROMOTION_CAP_MAX_IMPACT || "0.60",
        0.60,
        0.0,
        1.0
      ),
      requiresLCSPerfect: process.env.PROMOTION_CAP_REQUIRES_LCS_PERFECT !== "false",
    };

    // Retry caps
    const retryCaps = {
      maxRetries: parseInt(process.env.RETRY_CAP_MAX || "3", 10),
    };

    // Lineage caps
    const lineageCaps = {
      maxDepth: parseInt(process.env.LINEAGE_CAP_MAX_DEPTH || "50", 10),
    };

    return {
      cache_ttl_days,
      cache_enabled,
      deterministic_timeout_ms,
      semantic_audit_profiles,
      semantic_audit_timeout_ms,
      default_reaudit_interval_days,
      critical_reaudit_interval_days,
      policy_version,
      governanceControlPlaneUrl,
      hybridThreshold,
      hybridThresholdSource,
      grsWeights,
      violationCaps,
      promotionCaps,
      retryCaps,
      lineageCaps,
    };
  }

  static getDefaults(): GovernanceConfig {
    return {
      cache_ttl_days: 7,
      cache_enabled: true,
      deterministic_timeout_ms: 1000,
      semantic_audit_profiles: {
        fast: "claude-haiku-4-5",
        strict: "claude-opus-4-8",
      },
      semantic_audit_timeout_ms: 30000,
      default_reaudit_interval_days: 90,
      critical_reaudit_interval_days: 30,
      policy_version: "2.0",
      governanceControlPlaneUrl: "http://localhost:3113",
      hybridThreshold: 0.30,
      hybridThresholdSource: "operator",
      grsWeights: {
        w1: 0.40,
        w2: 0.20,
        w3: 0.20,
        w4: 0.20,
        k: 1.5,
      },
      violationCaps: {
        maxSoftMinor: 5,
        maxSoftMajor: 2,
        maxHardStructural: 0,
        maxHardRuntime: 1,
      },
      promotionCaps: {
        maxGRS: 0.70,
        maxImpactScore: 0.60,
        requiresLCSPerfect: true,
      },
      retryCaps: {
        maxRetries: 3,
      },
      lineageCaps: {
        maxDepth: 50,
      },
    };
  }

  private static parseFloatWithValidation(
    value: string,
    defaultVal: number,
    minInclusive: number,
    maxInclusive: number
  ): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return defaultVal;
    if (parsed < minInclusive || parsed > maxInclusive) {
      throw new Error(
        `GovernanceConfig value out of range: ${parsed} not in [${minInclusive}, ${maxInclusive}]`
      );
    }
    return parsed;
  }
}
