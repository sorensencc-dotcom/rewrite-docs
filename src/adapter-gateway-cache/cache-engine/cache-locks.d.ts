export declare class CacheLockManager {
    private acquiring;
    acquireLock(key: string): Promise<() => void>;
    private releaseLock;
    withLock<T>(key: string, fn: () => Promise<T>): Promise<T>;
    isLocked(key: string): boolean;
    clearAll(): void;
}
//# sourceMappingURL=cache-locks.d.ts.map