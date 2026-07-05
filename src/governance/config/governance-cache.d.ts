/**
 * Governance Configuration Cache (Phase 5)
 * Hot-reload support for GovernanceConfig.hybridThreshold (T)
 * Updates apply atomically at checkpoint boundaries
 */
import { GovernanceConfig } from "./governance.config";
export declare class GovernanceCache {
    private config;
    private pendingPatch;
    private canaryActive;
    constructor();
    /**
     * Get current governance configuration.
     */
    get(): GovernanceConfig;
    /**
     * Request a configuration patch (hot-reload).
     * If canary is active, queues for next checkpoint.
     * Otherwise applies immediately and atomically.
     */
    applyHotReload(patch: Partial<GovernanceConfig>, reason: string, changedBy: string): Promise<void>;
    /**
     * Notify cache that a canary is now active.
     * Used to gate hot-reloads to checkpoint boundaries.
     */
    onCanaryActive(): void;
    /**
     * Notify cache that a canary cycle is complete (checkpoint boundary).
     * Apply any pending patches at this boundary.
     */
    onCheckpointBoundary(): Promise<void>;
    /**
     * Apply a patch atomically and log to governance_threshold_log.
     * This is the only place where config is actually updated.
     */
    private applyAtomically;
}
export declare const governanceCache: GovernanceCache;
//# sourceMappingURL=governance-cache.d.ts.map