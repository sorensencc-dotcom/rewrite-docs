/**
 * Unified GovernanceConfig (Phase 5)
 * Single source of truth for all governance parameters.
 * Merges AuditConfig + GovernanceRouterConfig + Phase 5 adaptive governance fields.
 */
export interface GovernanceConfig {
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
    governanceControlPlaneUrl: string;
    hybridThreshold: number;
    hybridThresholdSource: 'operator';
    grsWeights?: {
        w1: number;
        w2: number;
        w3: number;
        w4: number;
        k: number;
    };
    violationCaps: {
        maxSoftMinor: number;
        maxSoftMajor: number;
        maxHardStructural: number;
        maxHardRuntime: number;
    };
    promotionCaps: {
        maxGRS: number;
        maxImpactScore: number;
        requiresLCSPerfect: boolean;
    };
    retryCaps: {
        maxRetries: number;
    };
    lineageCaps: {
        maxDepth: number;
    };
}
export declare class GovernanceConfigLoader {
    static load(): GovernanceConfig;
    static getDefaults(): GovernanceConfig;
    private static parseFloatWithValidation;
}
//# sourceMappingURL=governance.config.d.ts.map