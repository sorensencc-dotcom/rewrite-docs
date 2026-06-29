/**
 * Governance Configuration Cache (Phase 5)
 * Hot-reload support for GovernanceConfig.hybridThreshold (T)
 * Updates apply atomically at checkpoint boundaries
 */

import { GovernanceConfig, GovernanceConfigLoader } from "./governance.config";
import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";

export class GovernanceCache {
  private config: GovernanceConfig;
  private pendingPatch: Partial<GovernanceConfig> | null = null;
  private canaryActive = false;

  constructor() {
    this.config = GovernanceConfigLoader.load();
  }

  /**
   * Get current governance configuration.
   */
  get(): GovernanceConfig {
    return this.config;
  }

  /**
   * Request a configuration patch (hot-reload).
   * If canary is active, queues for next checkpoint.
   * Otherwise applies immediately and atomically.
   */
  async applyHotReload(
    patch: Partial<GovernanceConfig>,
    reason: string,
    changedBy: string
  ): Promise<void> {
    // Validate patch (T must be in [0.20, 0.40])
    if (patch.hybridThreshold !== undefined) {
      if (patch.hybridThreshold < 0.2 || patch.hybridThreshold > 0.4) {
        throw new Error(
          `hybridThreshold ${patch.hybridThreshold} out of constitutional range [0.20, 0.40]`
        );
      }
    }

    if (this.canaryActive) {
      // Queue for checkpoint boundary
      this.pendingPatch = patch;
      await pgQuery(
        `INSERT INTO governance_threshold_log (old_value, new_value, changed_by, reason, queued_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [
          this.config.hybridThreshold,
          patch.hybridThreshold ?? this.config.hybridThreshold,
          changedBy,
          reason,
        ]
      );
    } else {
      // Apply immediately
      await this.applyAtomically(patch, reason, changedBy);
    }
  }

  /**
   * Notify cache that a canary is now active.
   * Used to gate hot-reloads to checkpoint boundaries.
   */
  onCanaryActive(): void {
    this.canaryActive = true;
  }

  /**
   * Notify cache that a canary cycle is complete (checkpoint boundary).
   * Apply any pending patches at this boundary.
   */
  async onCheckpointBoundary(): Promise<void> {
    if (this.pendingPatch) {
      await this.applyAtomically(this.pendingPatch, "queued_at_checkpoint", "checkpoint");
      this.pendingPatch = null;
    }
    this.canaryActive = false;
  }

  /**
   * Apply a patch atomically and log to governance_threshold_log.
   * This is the only place where config is actually updated.
   */
  private async applyAtomically(
    patch: Partial<GovernanceConfig>,
    reason: string,
    changedBy: string
  ): Promise<void> {
    const oldT = this.config.hybridThreshold;

    // Update in-memory config
    this.config = { ...this.config, ...patch };

    // Log to audit trail
    await pgQuery(
      `INSERT INTO governance_threshold_log (old_value, new_value, changed_by, reason, applied_at, applied_at_runtime)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, TRUE)`,
      [
        oldT,
        patch.hybridThreshold ?? oldT,
        changedBy,
        reason,
      ]
    );
  }
}

// Singleton instance
export const governanceCache = new GovernanceCache();
