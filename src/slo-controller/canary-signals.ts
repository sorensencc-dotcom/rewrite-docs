import { EventEmitter } from 'events';

export interface CanarySignal {
  type: 'abort' | 'rollback' | 'rollback_start' | 'rollback_complete' | 'status_check';
  timestamp: number;
  reason?: string;
  context?: Record<string, any>;
}

export class CanaryEventBus extends EventEmitter {
  emit(type: CanarySignal['type'], signal: CanarySignal): boolean {
    return super.emit(type, signal);
  }

  onAbort(callback: (signal: CanarySignal) => void): void {
    this.on('abort', callback);
  }

  onRollback(callback: (signal: CanarySignal) => void): void {
    this.on('rollback', callback);
  }

  onRollbackComplete(callback: (signal: CanarySignal) => void): void {
    this.on('rollback_complete', callback);
  }
}

export const canaryEventBus = new CanaryEventBus();
