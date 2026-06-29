export class LatencyAwareRouter {
  constructor(private sloBudgetMs: number) {}

  evaluate(historicalP99: number) {
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
