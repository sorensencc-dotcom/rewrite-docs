export interface WarmPoolSession {
    id: string;
    browser: any;
    createdAt: number;
    lastUsedAt: number;
    healthy: boolean;
    navigationCount: number;
    errorCount: number;
    latencyMs: number[];
}
export interface WarmPoolMetrics {
    poolSize: number;
    targetSize: number;
    checkoutCount: number;
    checkinCount: number;
    spawnCount: number;
    recycleCount: number;
    avgLatencyMs: number;
    healthySessionCount: number;
    unhealthySessionCount: number;
    totalNavigations: number;
}
export declare class WarmPoolManager {
    private pool;
    private waitingList;
    private targetSize;
    private maxSessionAgeMs;
    private maxNavigationsPerSession;
    private healthCheckIntervalMs;
    private initializing;
    private initialized;
    private healthCheckInterval;
    private checkoutCount;
    private checkinCount;
    private spawnCount;
    private recycleCount;
    private totalNavigations;
    constructor(targetSize?: number);
    init(): Promise<void>;
    private spawnSession;
    checkout(timeoutMs?: number): Promise<WarmPoolSession>;
    checkin(session: WarmPoolSession): Promise<void>;
    recordNavigation(session: WarmPoolSession, latencyMs: number, success: boolean): Promise<void>;
    private startHealthCheck;
    private performHealthCheck;
    private isSessionResponsive;
    private isSessionValid;
    drain(): Promise<void>;
    getMetrics(): WarmPoolMetrics;
}
//# sourceMappingURL=WarmPoolManager.d.ts.map