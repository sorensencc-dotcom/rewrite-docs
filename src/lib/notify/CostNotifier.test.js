/**
 * CostNotifier Tests
 */
import { CostNotifier } from './CostNotifier';
describe('CostNotifier', () => {
    const mockReport = {
        usage: {
            dailyTokens: 50000,
            weeklyTokens: 350000,
            dailyProjection: 1500000,
        },
        cost: {
            dailyCost: 0.25,
            weeklyCost: 1.75,
            dailyProjection: 7.50,
        },
        local: {
            dailySavings: 0.50,
            weeklySavings: 3.50,
            gpuCostPerDay: 5.00,
            roi: 1.1,
        },
        agents: {
            burn: {
                researcher: { tokens: 25000, cost: 0.12 },
                synthesizer: { tokens: 15000, cost: 0.08 },
                analyzer: { tokens: 10000, cost: 0.05 },
            },
            savings: {
                researcher: 0.20,
                synthesizer: 0.15,
                analyzer: 0.10,
            },
        },
        budget: {
            ema: 0.30,
            alert: false,
            limit: 5.00,
        },
    };
    describe('sendSlackDaily', () => {
        it('should handle missing webhook gracefully', async () => {
            const oldEnv = process.env.CIC_SLACK_WEBHOOK_URL;
            delete process.env.CIC_SLACK_WEBHOOK_URL;
            const result = await CostNotifier.sendSlackDaily(mockReport, 'daily');
            expect(result).toBe(false);
            if (oldEnv)
                process.env.CIC_SLACK_WEBHOOK_URL = oldEnv;
        });
        it('should format email HTML with all sections', () => {
            const html = CostNotifier.formatEmailHtml(mockReport, 'daily');
            expect(html).toContain('CIC Daily Cost Report');
            expect(html).toContain('$0.25'); // daily cost
            expect(html).toContain('50000'); // daily tokens
            expect(html).toContain('researcher'); // agent name
            expect(html).toContain('$0.50'); // daily savings
        });
        it('should include budget alert when triggered', () => {
            const alertReport = {
                ...mockReport,
                budget: { ema: 6.00, alert: true, limit: 5.00 },
            };
            const html = CostNotifier.formatEmailHtml(alertReport, 'daily');
            expect(html).toContain('Budget Alert');
            expect(html).toContain('$6.00');
        });
    });
    describe('sendEmailDaily', () => {
        it('should handle missing email config gracefully', async () => {
            const oldEnv = process.env.CIC_NOTIFY_EMAIL;
            delete process.env.CIC_NOTIFY_EMAIL;
            const result = await CostNotifier.sendEmailDaily(mockReport, 'daily');
            expect(result).toBe(false);
            if (oldEnv)
                process.env.CIC_NOTIFY_EMAIL = oldEnv;
        });
        it('should log digest when nodemailer unavailable', async () => {
            process.env.CIC_NOTIFY_EMAIL = 'test@example.com';
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = await CostNotifier.sendEmailDaily(mockReport, 'daily');
            expect(result).toBe(true); // Should still return true (graceful fallback)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('EMAIL SUBJECT'));
            consoleSpy.mockRestore();
        });
    });
    describe('formatEmailHtml', () => {
        it('should generate valid HTML structure', () => {
            const html = CostNotifier.formatEmailHtml(mockReport, 'weekly');
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('CIC Weekly Cost Report');
            expect(html).toContain('</html>');
        });
        it('should handle missing agent data', () => {
            const reportNoAgents = {
                ...mockReport,
                agents: { burn: {}, savings: {} },
            };
            const html = CostNotifier.formatEmailHtml(reportNoAgents, 'daily');
            expect(html).toBeTruthy();
            expect(html).not.toContain('Top Agents'); // Should not include agent section
        });
        it('should format currency values correctly', () => {
            const html = CostNotifier.formatEmailHtml(mockReport, 'daily');
            expect(html).toContain('$0.25'); // Daily cost
            expect(html).toContain('$1.75'); // Weekly cost
            expect(html).toContain('$0.50'); // Daily savings
        });
    });
});
//# sourceMappingURL=CostNotifier.test.js.map