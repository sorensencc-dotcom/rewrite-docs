import { canaryEventBus, CanarySignal } from './canary-signals';
import { metricsExporter } from '../observability/metrics-endpoint';
import { executeCanaryRollback } from './canary-rollback';
import { pgQuery } from '../cic-runtime/audit-log/postgres-client';

export interface AbortContext {
  reason: string;
  sloId?: string;
  burnRate?: number;
  threshold?: number;
  violationDetails?: Record<string, any>;
}

type ViolationClass =
  | 'soft_violation_minor'
  | 'soft_violation_major'
  | 'hard_violation_structural'
  | 'hard_violation_runtime';

type AbortSeverity = 'soft' | 'hard';

export async function triggerCanaryAbort(
  proposalId: string,
  context: AbortContext
): Promise<void> {
  const startTime = Date.now();

  try {
    // Step 1: Record abort event to state machine
    await recordAbortEvent(proposalId, context.reason);

    // Step 2: Compute abort severity
    const violationClass = classifyViolationFromAbort(context.reason);
    const severity = computeAbortSeverity(violationClass);

    // Step 3: Rollback to previous version
    const rollbackResult = await executeCanaryRollback(proposalId);

    // Step 4: Append abort lineage
    await appendAbortLineage(proposalId, {
      abortReason: context.reason,
      severity,
      rollbackSuccess: rollbackResult.success,
      previousVersion: rollbackResult.previousVersion,
      durationMs: Date.now() - startTime,
    });

    // Step 5: Emit governance event
    const signal: CanarySignal = {
      type: 'abort',
      timestamp: Date.now(),
      reason: context.reason,
      context: { ...context, proposalId, severity },
    };

    // Record metric
    metricsExporter.recordCanaryAbort();

    // Emit signal (listeners: metrics, audit, gates)
    canaryEventBus.emit('abort', signal);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'unknown error';
    console.error(`[canary-abort] failed for proposal ${proposalId}:`, errorMsg);
    canaryEventBus.emit('abort', {
      type: 'abort',
      timestamp: Date.now(),
      reason: context.reason,
      context: { ...context, proposalId, error: errorMsg },
    } as any);
  }
}

function classifyViolationFromAbort(reason: string): ViolationClass {
  if (reason.includes('structural')) return 'hard_violation_structural';
  if (reason.includes('critical')) return 'hard_violation_runtime';
  if (reason.includes('repeat')) return 'soft_violation_major';
  return 'soft_violation_minor';
}

function computeAbortSeverity(violationClass: ViolationClass): AbortSeverity {
  return violationClass.startsWith('hard') ? 'hard' : 'soft';
}

async function recordAbortEvent(proposalId: string, abortReason: string): Promise<void> {
  // Write to canary_state_history table (PostgreSQL, Phase 5)
  // Schema columns: proposal_id, state, version, previous_version, snapshot, recorded_at
  await pgQuery(
    `INSERT INTO canary_state_history (proposal_id, state, version, previous_version, recorded_at)
     VALUES ($1, 'abort', '', NULL, CURRENT_TIMESTAMP)`,
    [proposalId]
  );
}

async function appendAbortLineage(
  proposalId: string,
  abortRecord: Record<string, any>
): Promise<void> {
  // Insert into unified lineage graph
  await pgQuery(
    `INSERT INTO lineage_events (event_type, source_system, entity_id, entity_type, payload, recorded_at)
     VALUES ('abort', 'governance', $1, 'proposal', $2, CURRENT_TIMESTAMP)`,
    [proposalId, JSON.stringify(abortRecord)]
  );
}
