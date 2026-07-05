import { EventEmitter } from 'events';
export class CanaryEventBus extends EventEmitter {
    emit(type, signal) {
        return super.emit(type, signal);
    }
    onAbort(callback) {
        this.on('abort', callback);
    }
    onRollback(callback) {
        this.on('rollback', callback);
    }
    onRollbackComplete(callback) {
        this.on('rollback_complete', callback);
    }
}
export const canaryEventBus = new CanaryEventBus();
//# sourceMappingURL=canary-signals.js.map