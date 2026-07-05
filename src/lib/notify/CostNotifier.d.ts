/**
 * CIC Cost Notifications
 * Slack webhook + Email delivery for daily cost digests
 */
import { CicCostComputeReport } from '../report/CicCostComputeReport';
export declare class CostNotifier {
    /**
     * Send cost digest to Slack via webhook
     */
    static sendSlackDaily(report: CicCostComputeReport, period?: 'daily' | 'weekly'): Promise<boolean>;
    /**
     * Send cost digest via email
     * Uses nodemailer if available, falls back to mock
     */
    static sendEmailDaily(report: CicCostComputeReport, period?: 'daily' | 'weekly'): Promise<boolean>;
    private static formatEmailHtml;
}
//# sourceMappingURL=CostNotifier.d.ts.map