export class LatencyAwareRouter {
    sloBudgetMs;
    constructor(sloBudgetMs) {
        this.sloBudgetMs = sloBudgetMs;
    }
    evaluate(historicalP99) {
        const dangerZone = this.sloBudgetMs * 0.9;
        if (historicalP99 >= this.sloBudgetMs) {
            return { requiresEscalation: true, reason: 'SLO_BREACH_HISTORICAL' };
        }
        if (historicalP99 >= dangerZone) {
            return { requiresEscalation: true, reason: 'SLO_DANGER_ZONE' };
        }
        return { requiresEscalation: false, reason: 'LATENCY_HEALTHY' };
    }
}
//# sourceMappingURL=latency-aware-router.js.map