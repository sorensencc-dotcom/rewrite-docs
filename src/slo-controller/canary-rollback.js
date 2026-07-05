import { canaryEventBus } from './canary-signals';
import { pgQuery } from '../cic-runtime/audit-log/postgres-client';
export async function executeCanaryRollback(proposalId) {
    const startTs = Date.now();
    canaryEventBus.emit('rollback', {
        type: 'rollback',
        timestamp: startTs,
        reason: 'slo_violation',
    });
    try {
        // Query previous version from canary_state_history
        const rows = await pgQuery(`SELECT previous_version FROM canary_state_history
       WHERE proposal_id = $1 ORDER BY recorded_at DESC LIMIT 1`, [proposalId]);
        if (rows.length === 0) {
            throw new Error(`No state history found for proposal ${proposalId}`);
        }
        const previousVersion = rows[0].previous_version;
        if (!previousVersion) {
            throw new Error(`No previous version recorded for proposal ${proposalId}`);
        }
        // TODO: Wire to Phase 5 deployment state machine
        // - Restore from canary state table
        // - Verify data integrity (audit log replay if needed)
        // - Wait for health checks to pass
        const completeTs = Date.now();
        const completeMs = completeTs - startTs;
        canaryEventBus.emit('rollback_complete', {
            type: 'rollback_complete',
            timestamp: completeTs,
            context: { completeMs, previousVersion },
        });
        return {
            success: true,
            previousVersion,
            completeMs,
            rolledBackAt: completeTs,
        };
    }
    catch (error) {
        return {
            success: false,
            previousVersion: null,
            completeMs: Date.now() - startTs,
            rolledBackAt: Date.now(),
            error: error instanceof Error ? error.message : 'unknown error',
        };
    }
}
//# sourceMappingURL=canary-rollback.js.map