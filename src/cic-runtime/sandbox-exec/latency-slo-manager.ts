export interface SloStatus {
  violated: boolean;
  exceededByMs: number;
}

export class LatencySloManager {
  constructor(private budgetMs: number) {}

  enforce(latencyMs: number): SloStatus {
    if (latencyMs > this.budgetMs) {
      return { violated: true, exceededByMs: latencyMs - this.budgetMs };
    }
    return { violated: false, exceededByMs: 0 };
  }
}
