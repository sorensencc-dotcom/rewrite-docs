import { canaryEventBus } from './canary-signals';
import { metricsExporter } from '../observability/metrics-endpoint';
import { executeCanaryRollback } from './canary-rollback';
import { pgQuery } from '../cic-runtime/audit-log/postgres-client';
export async function triggerCanaryAbort(proposalId, context) {
    const startTime = Date.now();
    let finalProposalId;
    let finalContext;
    if (typeof proposalId === 'object' && !context) {
        finalContext = proposalId;
        finalProposalId = finalContext.sloId ?? 'unknown_proposal';
    }
    else {
        finalProposalId = proposalId;
        finalContext = context || { reason: 'unknown_violation' };
    }
    const reason = finalContext.reason ?? 'unknown_violation';
    try {
        // Step 1: Record abort event to state machine
        await recordAbortEvent(finalProposalId, reason);
        // Step 2: Compute abort severity
        const violationClass = classifyViolationFromAbort(reason);
        const severity = computeAbortSeverity(violationClass);
        // Step 3: Rollback to previous version
        const rollbackResult = await executeCanaryRollback(finalProposalId);
        // Step 4: Append abort lineage
        await appendAbortLineage(finalProposalId, {
            abortReason: reason,
            severity,
            rollbackSuccess: rollbackResult.success,
            previousVersion: rollbackResult.previousVersion,
            durationMs: Date.now() - startTime,
        });
        // Step 5: Emit governance event
        const signal = {
            type: 'abort',
            timestamp: Date.now(),
            reason,
            context: { ...finalContext, proposalId: finalProposalId, severity },
        };
        // Record metric
        metricsExporter.recordCanaryAbort();
        // Emit signal (listeners: metrics, audit, gates)
        canaryEventBus.emit('abort', signal);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'unknown error';
        console.error(`[canary-abort] failed for proposal ${finalProposalId}:`, errorMsg);
        canaryEventBus.emit('abort', {
            type: 'abort',
            timestamp: Date.now(),
            reason,
            context: { ...finalContext, proposalId: finalProposalId, error: errorMsg },
        });
    }
}
function classifyViolationFromAbort(reason) {
    if (reason.includes('structural'))
        return 'hard_violation_structural';
    if (reason.includes('critical'))
        return 'hard_violation_runtime';
    if (reason.includes('repeat'))
        return 'soft_violation_major';
    return 'soft_violation_minor';
}
function computeAbortSeverity(violationClass) {
    return violationClass.startsWith('hard') ? 'hard' : 'soft';
}
async function recordAbortEvent(proposalId, abortReason) {
    // Write to canary_state_history table (PostgreSQL, Phase 5)
    // Schema columns: proposal_id, current_version, previous_version, event_type, recorded_at
    await pgQuery(`INSERT INTO canary_state_history (proposal_id, current_version, previous_version, event_type, recorded_at)
     VALUES ($1, '', NULL, 'abort', CURRENT_TIMESTAMP)`, [proposalId]);
}
async function appendAbortLineage(proposalId, abortRecord) {
    // Insert into unified lineage graph
    await pgQuery(`INSERT INTO lineage_events (event_type, source_system, entity_id, entity_type, payload, recorded_at)
     VALUES ('abort', 'governance', $1, 'proposal', $2, CURRENT_TIMESTAMP)`, [proposalId, JSON.stringify(abortRecord)]);
}
//# sourceMappingURL=canary-abort.js.map