import { EventEmitter } from 'events';
export interface CanarySignal {
    type: 'abort' | 'rollback' | 'rollback_start' | 'rollback_complete' | 'status_check';
    timestamp: number;
    reason?: string;
    context?: Record<string, any>;
}
export declare class CanaryEventBus extends EventEmitter {
    emit(type: CanarySignal['type'], signal: CanarySignal): boolean;
    onAbort(callback: (signal: CanarySignal) => void): void;
    onRollback(callback: (signal: CanarySignal) => void): void;
    onRollbackComplete(callback: (signal: CanarySignal) => void): void;
}
export declare const canaryEventBus: CanaryEventBus;
//# sourceMappingURL=canary-signals.d.ts.map