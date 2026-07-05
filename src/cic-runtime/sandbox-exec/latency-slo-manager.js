export class LatencySloManager {
    budgetMs;
    constructor(budgetMs) {
        this.budgetMs = budgetMs;
    }
    enforce(latencyMs) {
        if (latencyMs > this.budgetMs) {
            return { violated: true, exceededByMs: latencyMs - this.budgetMs };
        }
        return { violated: false, exceededByMs: 0 };
    }
}
//# sourceMappingURL=latency-slo-manager.js.map