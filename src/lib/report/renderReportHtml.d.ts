/**
 * CIC Cost Compute Report — HTML Renderer
 * Generates full HTML page with inline SVGs for PDF or web display
 */
import { CicCostComputeReport } from './CicCostComputeReport';
export interface RenderOptions {
    title?: string;
    period?: 'daily' | 'weekly';
    includeCharts?: boolean;
}
/**
 * Generate full HTML report with dark theme + inline SVGs
 */
export declare function renderReportHtml(report: CicCostComputeReport, options?: RenderOptions): string;
//# sourceMappingURL=renderReportHtml.d.ts.map