import { canaryEventBus } from './canary-signals';
const ROLLBACK_TARGET_MS = 300;
export async function measureCanaryRollbackTiming(triggerContext, rollbackFn) {
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
    });
    await rollbackFn();
    const completeTs = Date.now();
    canaryEventBus.emit('rollback_complete', {
        type: 'rollback_complete',
        timestamp: completeTs,
        context: { totalMs: completeTs - abortTs },
    });
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
//# sourceMappingURL=rollback-timing-harness.js.map