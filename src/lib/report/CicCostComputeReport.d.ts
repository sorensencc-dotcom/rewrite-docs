/**
 * Unified CIC Cost & Compute Report
 * Single source of truth for all cost/usage analytics
 */
export interface CicCostComputeReport {
    usage: {
        dailyTokens: number;
        weeklyTokens: number;
        dailyProjection: number;
    };
    cost: {
        dailyCost: number;
        weeklyCost: number;
        dailyProjection: number;
    };
    local: {
        dailySavings: number;
        weeklySavings: number;
        gpuCostPerDay: number;
        roi: number;
    };
    agents: {
        burn: Record<string, {
            tokens: number;
            cost: number;
        }>;
        savings: Record<string, number>;
    };
    env?: {
        daily: {
            dev: {
                tokens: number;
                cost: number;
            };
            prod: {
                tokens: number;
                cost: number;
            };
        };
    };
    budget?: {
        ema: number;
        alert: boolean;
        limit: number;
    };
}
export declare function generateCicCostComputeReport(): CicCostComputeReport;
//# sourceMappingURL=CicCostComputeReport.d.ts.map