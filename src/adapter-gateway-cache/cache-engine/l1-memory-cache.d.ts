export declare class L1MemoryCache {
    private store;
    private maxEntries;
    private onEviction?;
    constructor(maxEntries?: number, onEviction?: (key: string) => void);
    get(key: string): any | null;
    set(key: string, value: any, ttlMs?: number): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
    entries(): Array<[string, any]>;
}
//# sourceMappingURL=l1-memory-cache.d.ts.map