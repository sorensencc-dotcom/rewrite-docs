// src/build-system/state-machine-logger.ts
export class ConsoleStateMachineLogger {
    log(t) {
        // e.g. [2026-06-12T23:47:00Z] build-1 node-3 RUNNING -> DETECTING
        // eslint-disable-next-line no-console
        console.log(`[${t.timestamp}] ${t.buildId} ${t.nodeId} ${t.from} -> ${t.to}`);
    }
}
//# sourceMappingURL=state-machine-logger.js.map