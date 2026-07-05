export interface RollbackTimingResult {
    abortToStartMs: number;
    startToCompleteMs: number;
    totalMs: number;
    withinTarget: boolean;
}
export declare function measureCanaryRollbackTiming(triggerContext: any, rollbackFn: () => Promise<void>): Promise<RollbackTimingResult>;
//# sourceMappingURL=rollback-timing-harness.d.ts.map