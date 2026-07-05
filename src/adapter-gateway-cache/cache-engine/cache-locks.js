export class CacheLockManager {
    acquiring = new Map();
    async acquireLock(key) {
        while (this.acquiring.has(key)) {
            await this.acquiring.get(key);
        }
        let resolveAcquire = null;
        const lockPromise = new Promise((resolve) => {
            resolveAcquire = resolve;
        });
        this.acquiring.set(key, lockPromise);
        return () => this.releaseLock(key, resolveAcquire);
    }
    releaseLock(key, resolve) {
        if (resolve)
            resolve();
        this.acquiring.delete(key);
    }
    async withLock(key, fn) {
        const release = await this.acquireLock(key);
        try {
            return await fn();
        }
        finally {
            release();
        }
    }
    isLocked(key) {
        return this.acquiring.has(key);
    }
    clearAll() {
        this.acquiring.clear();
    }
}
//# sourceMappingURL=cache-locks.js.map