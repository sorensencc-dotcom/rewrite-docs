export interface AuditConfig {
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
}
export declare function loadAuditConfig(): AuditConfig;
export declare function getDefaultAuditConfig(): AuditConfig;
//# sourceMappingURL=audit.config.d.ts.map