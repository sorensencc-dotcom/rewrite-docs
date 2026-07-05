/**
 * CIC Cost Notifications
 * Slack webhook + Email delivery for daily cost digests
 */
export class CostNotifier {
    /**
     * Send cost digest to Slack via webhook
     */
    static async sendSlackDaily(report, period = 'daily') {
        const webhookUrl = process.env.CIC_SLACK_WEBHOOK_URL;
        if (!webhookUrl) {
            console.log('[NOTIFY] Slack webhook not configured (CIC_SLACK_WEBHOOK_URL)');
            return false;
        }
        try {
            const title = period === 'daily' ? '📊 Daily Cost Report' : '📈 Weekly Cost Report';
            const gpuCost = report.local?.gpuCostPerDay ?? 0;
            const savings = report.local?.dailySavings ?? 0;
            const roi = report.local?.roi ?? 0;
            const blocks = [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*${title}*`,
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Daily Tokens*\n${report.usage?.dailyTokens?.toLocaleString() ?? '—'}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Daily Cost*\n$${report.cost?.dailyCost?.toFixed(2) ?? '0.00'}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Weekly Tokens*\n${report.usage?.weeklyTokens?.toLocaleString() ?? '—'}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Weekly Cost*\n$${report.cost?.weeklyCost?.toFixed(2) ?? '0.00'}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Local Savings/Day*\n$${savings?.toFixed(2) ?? '0.00'}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*GPU Cost/Day*\n$${gpuCost?.toFixed(2) ?? '0.00'}`
                        }
                    ]
                }
            ];
            const message = { blocks };
            // Add per-agent breakdown if available
            if (report.agents?.burn && Object.keys(report.agents.burn).length > 0) {
                const agentLines = Object.entries(report.agents.burn)
                    .slice(0, 5) // Top 5 agents
                    .map(([agent, stats]) => `• ${agent}: ${stats.tokens.toLocaleString()} tokens, $${stats.cost.toFixed(2)}`)
                    .join('\n');
                blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Top Agents*\n${agentLines}`
                    }
                });
            }
            // Add budget alert if triggered
            if (report.budget?.alert) {
                blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `⚠️ *Budget Alert*\nDaily burn $${report.budget?.ema?.toFixed(2) ?? '0.00'} exceeds limit $${report.budget?.limit?.toFixed(2) ?? '0.00'}`
                    }
                });
            }
            blocks.push({
                type: 'divider'
            });
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
            if (!response.ok) {
                console.error(`[NOTIFY] Slack webhook failed: ${response.status} ${response.statusText}`);
                return false;
            }
            console.log(`[NOTIFY] Slack digest sent (${period})`);
            return true;
        }
        catch (err) {
            console.error('[NOTIFY] Slack send error:', err);
            return false;
        }
    }
    /**
     * Send cost digest via email
     * Uses nodemailer if available, falls back to mock
     */
    static async sendEmailDaily(report, period = 'daily') {
        const toEmail = process.env.CIC_NOTIFY_EMAIL;
        if (!toEmail) {
            console.log('[NOTIFY] Email not configured (CIC_NOTIFY_EMAIL)');
            return false;
        }
        try {
            const subject = period === 'daily' ? 'CIC Daily Cost Report' : 'CIC Weekly Cost Report';
            const html = this.formatEmailHtml(report, period);
            // Try nodemailer if available
            try {
                // @ts-ignore nodemailer is optional
                const nodemailer = await import('nodemailer');
                const smtpConfig = {
                    host: process.env.CIC_SMTP_HOST || 'localhost',
                    port: parseInt(process.env.CIC_SMTP_PORT || '25'),
                    secure: process.env.CIC_SMTP_SECURE === 'true',
                    auth: process.env.CIC_SMTP_USER && process.env.CIC_SMTP_PASS
                        ? { user: process.env.CIC_SMTP_USER, pass: process.env.CIC_SMTP_PASS }
                        : undefined
                };
                const transporter = nodemailer.default.createTransport(smtpConfig);
                await transporter.sendMail({
                    from: process.env.CIC_NOTIFY_FROM || 'cic@example.com',
                    to: toEmail,
                    subject,
                    html
                });
                console.log(`[NOTIFY] Email sent to ${toEmail} (${period})`);
                return true;
            }
            catch (nodemailerErr) {
                console.log('[NOTIFY] nodemailer unavailable, logging digest instead');
                console.log(`[NOTIFY] EMAIL SUBJECT: ${subject}`);
                console.log(`[NOTIFY] EMAIL TO: ${toEmail}`);
                console.log('[NOTIFY] EMAIL BODY (HTML):');
                console.log(html);
                return true; // Mock success
            }
        }
        catch (err) {
            console.error('[NOTIFY] Email send error:', err);
            return false;
        }
    }
    static formatEmailHtml(report, period) {
        const gpuCost = report.local?.gpuCostPerDay ?? 0;
        const savings = report.local?.dailySavings ?? 0;
        const agentRows = report.agents?.burn
            ? Object.entries(report.agents.burn)
                .slice(0, 10)
                .map(([agent, stats]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${agent}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${stats.tokens.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${stats.cost.toFixed(2)}</td>
        </tr>
      `)
                .join('')
            : '';
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; background: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #0066cc; margin-top: 0; }
    h2 { color: #333; font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
    .metric { display: inline-block; width: 48%; margin-right: 2%; vertical-align: top; }
    .value { font-size: 24px; font-weight: bold; color: #0066cc; }
    .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f0f0f0; padding: 10px; text-align: left; font-weight: 600; font-size: 12px; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 4px; margin-top: 15px; }
    .footer { font-size: 12px; color: #999; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${period === 'daily' ? '📊' : '📈'} CIC ${period === 'daily' ? 'Daily' : 'Weekly'} Cost Report</h1>

    <div class="metric">
      <div class="label">Daily Tokens</div>
      <div class="value">${(report.usage?.dailyTokens ?? 0).toLocaleString()}</div>
    </div>
    <div class="metric">
      <div class="label">Daily Cost</div>
      <div class="value">$${(report.cost?.dailyCost ?? 0).toFixed(2)}</div>
    </div>

    <div style="clear: both; margin-top: 15px;"></div>

    <div class="metric">
      <div class="label">Weekly Tokens</div>
      <div class="value">${(report.usage?.weeklyTokens ?? 0).toLocaleString()}</div>
    </div>
    <div class="metric">
      <div class="label">Weekly Cost</div>
      <div class="value">$${(report.cost?.weeklyCost ?? 0).toFixed(2)}</div>
    </div>

    <div style="clear: both;"></div>

    <h2>Local Model Savings</h2>
    <div class="metric">
      <div class="label">Daily Savings</div>
      <div class="value">$${savings.toFixed(2)}</div>
    </div>
    <div class="metric">
      <div class="label">GPU Cost/Day</div>
      <div class="value">$${gpuCost.toFixed(2)}</div>
    </div>
    <div style="clear: both;"></div>

    ${agentRows ? `
      <h2>Top Agents</h2>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th style="text-align: right;">Tokens</th>
            <th style="text-align: right;">Cost</th>
          </tr>
        </thead>
        <tbody>
          ${agentRows}
        </tbody>
      </table>
    ` : ''}

    ${report.budget?.alert ? `
      <div class="alert">
        <strong>⚠️ Budget Alert</strong><br>
        Daily burn <strong>$${report.budget?.ema?.toFixed(2)}</strong> exceeds limit <strong>$${report.budget?.limit?.toFixed(2)}</strong>
      </div>
    ` : ''}

    <div class="footer">
      Generated ${new Date().toLocaleString()}<br>
      CIC Cost & Usage Monitoring System
    </div>
  </div>
</body>
</html>
    `.trim();
    }
}
//# sourceMappingURL=CostNotifier.js.map