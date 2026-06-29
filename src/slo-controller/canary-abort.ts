import { canaryEventBus, CanarySignal } from './canary-signals';
import { metricsExporter } from '../observability/metrics-endpoint';

export interface AbortContext {
  reason: string;
  sloId?: string;
  burnRate?: number;
  threshold?: number;
  violationDetails?: Record<string, any>;
}

export async function triggerCanaryAbort(context: AbortContext): Promise<void> {
  const signal: CanarySignal = {
    type: 'abort',
    timestamp: Date.now(),
    reason: context.reason,
    context,
  };

  // Record metric
  metricsExporter.recordCanaryAbort();

  // Emit signal (listeners: metrics, audit, gates)
  canaryEventBus.emit('abort', signal);

  // TODO: Wire to Phase 5 deployment rollback chain
  // - Send abort signal to deployment orchestrator
  // - Trigger health check suspension
  // - Queue rollback task
}
