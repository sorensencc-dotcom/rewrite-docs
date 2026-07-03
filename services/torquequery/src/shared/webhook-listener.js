"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebhookRouter = createWebhookRouter;
const express_1 = require("express");
const logger_1 = require("./utils/logger");
const logger = new logger_1.Logger('WebhookListener');
function createWebhookRouter() {
    const router = (0, express_1.Router)();
    router.post('/slo/violation', async (req, res) => {
        const event = req.body;
        logger.warn('SLO violation received', {
            type: event.type,
            adapter: event.adapter,
            severity: event.severity,
        });
        handleSLOViolation(event).catch((error) => {
            logger.error('Failed to handle SLO violation', {
                error: error instanceof Error ? error.message : String(error),
            });
        });
        res.json({ accepted: true });
    });
    router.post('/events/slo-violation', async (req, res) => {
        const event = req.body;
        logger.info('SLO event received', {
            type: event.type,
            severity: event.severity,
        });
        handleSLOEvent(event).catch((error) => {
            logger.error('Failed to handle SLO event', {
                error: error instanceof Error ? error.message : String(error),
            });
        });
        res.json({ accepted: true });
    });
    return router;
}
async function handleSLOViolation(event) {
    switch (event.severity) {
        case 'CRITICAL':
            logger.error('CRITICAL SLO violation', event);
            await notifyOncall(event);
            await notifySlack(event);
            break;
        case 'HIGH':
            logger.warn('HIGH SLO violation', event);
            await notifySlack(event);
            break;
        case 'MEDIUM':
            logger.info('MEDIUM SLO violation', event);
            await logEvent(event);
            break;
        default:
            logger.debug('LOW SLO violation', event);
    }
}
async function handleSLOEvent(event) {
    logger.info('Handling SLO event', { type: event.type });
    if (event.type === 'VERTICAL_DRIFT') {
        await handleDriftEvent(event);
    }
    else if (event.type === 'SPA_HYDRATION_FAILURE') {
        await handleHydrationFailure(event);
    }
    else if (event.type === 'CONFIDENCE_DROP') {
        await handleConfidenceDrop(event);
    }
    else if (event.type === 'TIMEOUT') {
        await handleTimeout(event);
    }
    else if (event.type === 'SCHEMA_MISMATCH') {
        await handleSchemaMismatch(event);
    }
}
async function handleDriftEvent(event) {
    logger.info('Drift detected', {
        adapter: event.adapter,
        details: event.details,
    });
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        await notifySlack({
            type: 'VERTICAL_DRIFT',
            adapter: event.adapter,
            severity: event.severity,
            timestamp: event.timestamp,
            message: `Vertical drift detected in adapter ${event.adapter}`,
            details: event.details,
        });
    }
}
async function handleHydrationFailure(event) {
    logger.warn('Hydration failure', {
        adapter: event.adapter,
        details: event.details,
    });
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        await notifySlack({
            type: 'SPA_HYDRATION_FAILURE',
            adapter: event.adapter,
            severity: event.severity,
            timestamp: event.timestamp,
            message: `Hydration failure in adapter ${event.adapter}`,
            details: event.details,
        });
    }
}
async function handleConfidenceDrop(event) {
    logger.warn('Confidence drop', {
        adapter: event.adapter,
        details: event.details,
    });
}
async function handleTimeout(event) {
    logger.error('Adapter timeout', {
        adapter: event.adapter,
        details: event.details,
    });
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await notifySlack({
            type: 'TIMEOUT',
            adapter: event.adapter,
            severity: event.severity,
            timestamp: event.timestamp,
            message: `Adapter ${event.adapter} exceeded timeout threshold`,
            details: event.details,
        });
    }
}
async function handleSchemaMismatch(event) {
    logger.warn('Schema mismatch detected', {
        adapter: event.adapter,
        details: event.details,
    });
}
async function notifyOncall(event) {
    logger.error('ONCALL NOTIFICATION', {
        severity: event.severity,
        adapter: 'adapter' in event ? event.adapter : 'unknown',
        message: 'message' in event ? event.message : 'CRITICAL SLO VIOLATION',
    });
    // TODO: Implement actual oncall notification (PagerDuty, Opsgenie, etc.)
}
async function notifySlack(event) {
    const slackWebhook = process.env.SLACK_WEBHOOK;
    if (!slackWebhook) {
        logger.warn('SLACK_WEBHOOK not configured, skipping notification');
        return;
    }
    const payload = {
        text: `SLO Violation: ${event.severity}`,
        attachments: [
            {
                color: event.severity === 'CRITICAL' ? 'danger' : event.severity === 'HIGH' ? 'warning' : 'good',
                fields: [
                    {
                        title: 'Type',
                        value: event.type,
                        short: true,
                    },
                    {
                        title: 'Adapter',
                        value: 'adapter' in event ? event.adapter : 'unknown',
                        short: true,
                    },
                    {
                        title: 'Severity',
                        value: event.severity,
                        short: true,
                    },
                    {
                        title: 'Timestamp',
                        value: new Date(event.timestamp).toISOString(),
                        short: true,
                    },
                    {
                        title: 'Details',
                        value: JSON.stringify(event.details || {}),
                        short: false,
                    },
                ],
            },
        ],
    };
    try {
        const response = await fetch(slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            logger.error('Slack notification failed', {
                status: response.status,
                statusText: response.statusText,
            });
        }
        else {
            logger.info('Slack notification sent', {
                severity: event.severity,
            });
        }
    }
    catch (error) {
        logger.error('Failed to send Slack notification', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
async function logEvent(event) {
    logger.info('Event logged', event);
}
