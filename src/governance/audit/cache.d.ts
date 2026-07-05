import { AuditResult } from "../models";
export interface CacheClient {
    get(key: string): Promise<string | null>;
    setex(key: string, ttl: number, value: string): Promise<void>;
    del(key: string): Promise<void>;
}
export declare class AuditCache {
    private redis;
    private ttl;
    constructor(redis: CacheClient);
    getKey(skillId: string, version: string, policyVersion: string): string;
    get(skillId: string, version: string, policyVersion: string): Promise<{
        result: AuditResult;
        isStale: () => boolean;
    } | null>;
    set(result: AuditResult, policyVersion: string): Promise<void>;
    invalidate(skillId: string, version: string, policyVersion: string): Promise<void>;
    setTTL(days: number): void;
}
//# sourceMappingURL=cache.d.ts.map