export interface SloStatus {
    violated: boolean;
    exceededByMs: number;
}
export declare class LatencySloManager {
    private budgetMs;
    constructor(budgetMs: number);
    enforce(latencyMs: number): SloStatus;
}
//# sourceMappingURL=latency-slo-manager.d.ts.map