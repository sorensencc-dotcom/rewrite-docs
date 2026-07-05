/**
 * GPU Amortization & Cost Calculation
 * Daily cost: (purchasePrice / lifetimeDays) + powerCostPerDay
 */
export interface GpuCostConfig {
    purchasePrice: number;
    lifetimeDays: number;
    powerCostPerDay: number;
}
export declare function getDailyGpuCost(gpuModel?: string): number;
//# sourceMappingURL=GpuAmortization.d.ts.map