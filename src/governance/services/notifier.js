// SCP Notifier - Phase 28a.6
// Slack webhook integration for skill contribution events
// Events: PR submitted, merged, closed, changes requested
const log = (skillId, msg) => console.log(`[SCP-NOTIFIER:${skillId}] ${msg}`);
const logError = (skillId, msg, error) => console.error(`[SCP-NOTIFIER:${skillId}] ERROR: ${msg}`, error);
export class Notifier {
    db;
    webhookUrl;
    channel;
    timeout;
    constructor(db, config) {
        this.db = db;
        this.webhookUrl = config?.webhookUrl || process.env.SLACK_WEBHOOK_SCP || "";
        this.channel = config?.channel || "#skill-contrib-alerts";
        this.timeout = config?.timeout || 10000;
        if (!this.webhookUrl) {
            throw new Error("Slack webhook URL required (SLACK_WEBHOOK_SCP env var)");
        }
    }
    // Notify: PR submitted
    async notifySubmitted(skillId, skillName, prNumber, prUrl, linesAdded, linesDeleted) {
        try {
            const percentChange = linesAdded + linesDeleted;
            const color = percentChange > 50 ? "warning" : "good";
            const message = {
                channel: this.channel,
                attachments: [
                    {
                        color,
                        title: `📤 Skill Contribution Submitted`,
                        fields: [
                            {
                                title: "Skill",
                                value: `\`${skillId}\` - ${skillName}`,
                                short: true,
                            },
                            {
                                title: "PR",
                                value: `#${prNumber}`,
                                short: true,
                            },
                            {
                                title: "Changes",
                                value: `+${linesAdded} -${linesDeleted} lines`,
                                short: true,
                            },
                            {
                                title: "Impact",
                                value: `${percentChange} lines changed`,
                                short: true,
                            },
                        ],
                        actions: [
                            {
                                type: "button",
                                text: "View PR",
                                url: prUrl,
                            },
                        ],
                        ts: Math.floor(Date.now() / 1000),
                    },
                ],
            };
            await this.sendWebhook(skillId, message);
            log(skillId, `Submitted notification sent (PR #${prNumber})`);
        }
        catch (error) {
            logError(skillId, "Failed to send submitted notification", error);
            // Non-fatal: don't throw
        }
    }
    // Notify: PR merged
    async notifyMerged(skillId, skillName, prNumber, prUrl, mergedAt) {
        try {
            const message = {
                channel: this.channel,
                attachments: [
                    {
                        color: "good",
                        title: `✅ Skill Contribution Merged`,
                        fields: [
                            {
                                title: "Skill",
                                value: `\`${skillId}\` - ${skillName}`,
                                short: true,
                            },
                            {
                                title: "PR",
                                value: `#${prNumber}`,
                                short: true,
                            },
                            {
                                title: "Merged At",
                                value: new Date(mergedAt).toISOString(),
                                short: true,
                            },
                        ],
                        actions: [
                            {
                                type: "button",
                                text: "View PR",
                                url: prUrl,
                            },
                        ],
                        ts: Math.floor(Date.now() / 1000),
                    },
                ],
            };
            await this.sendWebhook(skillId, message);
            log(skillId, `Merged notification sent (PR #${prNumber})`);
        }
        catch (error) {
            logError(skillId, "Failed to send merged notification", error);
            // Non-fatal: don't throw
        }
    }
    // Notify: Changes requested
    async notifyChangesRequested(skillId, skillName, prNumber, prUrl, reviewComments) {
        try {
            const message = {
                channel: this.channel,
                attachments: [
                    {
                        color: "warning",
                        title: `⚠️  Changes Requested`,
                        fields: [
                            {
                                title: "Skill",
                                value: `\`${skillId}\` - ${skillName}`,
                                short: true,
                            },
                            {
                                title: "PR",
                                value: `#${prNumber}`,
                                short: true,
                            },
                            {
                                title: "Review Comments",
                                value: String(reviewComments),
                                short: true,
                            },
                        ],
                        actions: [
                            {
                                type: "button",
                                text: "Review Changes",
                                url: prUrl,
                            },
                        ],
                        ts: Math.floor(Date.now() / 1000),
                    },
                ],
            };
            await this.sendWebhook(skillId, message);
            log(skillId, `Changes-requested notification sent (PR #${prNumber})`);
        }
        catch (error) {
            logError(skillId, "Failed to send changes-requested notification", error);
            // Non-fatal: don't throw
        }
    }
    // Notify: PR closed without merge
    async notifyClosed(skillId, skillName, prNumber, prUrl) {
        try {
            const message = {
                channel: this.channel,
                attachments: [
                    {
                        color: "danger",
                        title: `❌ Skill Contribution Closed`,
                        fields: [
                            {
                                title: "Skill",
                                value: `\`${skillId}\` - ${skillName}`,
                                short: true,
                            },
                            {
                                title: "PR",
                                value: `#${prNumber}`,
                                short: true,
                            },
                        ],
                        actions: [
                            {
                                type: "button",
                                text: "View PR",
                                url: prUrl,
                            },
                        ],
                        ts: Math.floor(Date.now() / 1000),
                    },
                ],
            };
            await this.sendWebhook(skillId, message);
            log(skillId, `Closed notification sent (PR #${prNumber})`);
        }
        catch (error) {
            logError(skillId, "Failed to send closed notification", error);
            // Non-fatal: don't throw
        }
    }
    // Send webhook to Slack
    async sendWebhook(skillId, payload) {
        return new Promise((resolve, reject) => {
            const https = require("https");
            const url = new URL(this.webhookUrl);
            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: this.timeout,
            };
            const req = https.request(options, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk.toString()));
                res.on("end", () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve();
                    }
                    else {
                        reject(new Error(`Slack webhook failed: HTTP ${res.statusCode} - ${data}`));
                    }
                });
                res.on("error", reject);
            });
            req.on("timeout", () => {
                req.destroy();
                reject(new Error(`Slack webhook timeout after ${this.timeout}ms`));
            });
            req.on("error", reject);
            req.write(JSON.stringify(payload));
            req.end();
        });
    }
}
//# sourceMappingURL=notifier.js.map