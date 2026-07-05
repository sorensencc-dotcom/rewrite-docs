export class KillSwitch {
    static enforce(promise, timeoutMs) {
        if (timeoutMs <= 0) {
            throw new Error('[KillSwitch] timeoutMs must be positive');
        }
        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error(`[KillSwitch] Hard execution timeout exceeded: ${timeoutMs}ms`));
            }, timeoutMs);
        });
        return Promise.race([
            promise.finally(() => clearTimeout(timeoutHandle)),
            timeoutPromise
        ]);
    }
}
//# sourceMappingURL=kill-switch.js.map