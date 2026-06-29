import { executeCanaryRollback } from './canary-rollback';
import { canaryEventBus } from './canary-signals';

export interface RollbackTimingResult {
  abortToStartMs: number;
  startToCompleteMs: number;
  totalMs: number;
  withinTarget: boolean;
}

const ROLLBACK_TARGET_MS = 300;

export async function measureCanaryRollbackTiming(
  triggerContext: any,
  rollbackFn: () => Promise<void>
): Promise<RollbackTimingResult> {
  const abortTs = Date.now();

  canaryEventBus.emit('abort', {
    type: 'abort',
    timestamp: abortTs,
    reason: 'timing_harness',
    context: triggerContext,
  });

  const startTs = Date.now();
  canaryEventBus.emit('rollback', {
    type: 'rollback',
    timestamp: startTs,
    reason: 'timing_harness',
  } as any);

  await rollbackFn();

  const completeTs = Date.now();
  canaryEventBus.emit('rollback_complete', {
    type: 'rollback_complete',
    timestamp: completeTs,
    context: { totalMs: completeTs - abortTs },
  } as any);

  const abortToStartMs = startTs - abortTs;
  const startToCompleteMs = completeTs - startTs;
  const totalMs = completeTs - abortTs;

  return {
    abortToStartMs,
    startToCompleteMs,
    totalMs,
    withinTarget: totalMs <= ROLLBACK_TARGET_MS,
  };
}
