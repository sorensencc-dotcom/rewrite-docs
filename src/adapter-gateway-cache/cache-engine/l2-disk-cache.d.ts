export declare class L2DiskCache {
    private dir;
    private lockManager;
    constructor(dir: string);
    init(): Promise<void>;
    get(key: string): Promise<any | null>;
    set(key: string, value: any, ttlMs?: number): Promise<void>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    list(): Promise<string[]>;
}
//# sourceMappingURL=l2-disk-cache.d.ts.map