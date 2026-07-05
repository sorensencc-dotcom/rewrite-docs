/**
 * CIC Cost Charts — Dark-Mode SVG Renderers
 * Returns inline SVG strings for dashboard + PDF use
 */
export interface DailyCostData {
    date: string;
    tokens: number;
    cost: number;
}
export interface ModelCostData {
    model: string;
    cost: number;
    tokens: number;
}
/**
 * Render 7-day usage + cost polyline chart
 * Two overlaid series: tokens (green) + cost (blue)
 */
export declare function renderUsageCost7dSvg(data: DailyCostData[]): string;
/**
 * Render 7-day local savings polyline chart
 * Single series: savings (pink)
 */
export declare function renderLocalSavings7dSvg(data: DailyCostData[]): string;
/**
 * Render per-model cost bar chart
 * Bars: usage tokens + cost per model
 */
export declare function renderPerModelCostSvg(models: ModelCostData[]): string;
//# sourceMappingURL=CostCharts.d.ts.map