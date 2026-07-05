export declare class LatencyAwareRouter {
    private sloBudgetMs;
    constructor(sloBudgetMs: number);
    evaluate(historicalP99: number): {
        requiresEscalation: boolean;
        reason: string;
    };
}
//# sourceMappingURL=latency-aware-router.d.ts.map