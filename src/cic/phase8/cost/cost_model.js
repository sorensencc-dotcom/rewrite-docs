/**
 * Phase 8: Cost Model
 * Maintains rolling windows of cost data (5m, 1h, 24h).
 */
export class CostModel {
    maxEventsInMemory;
    events = [];
    windows = {
        '5m': 5 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000
    };
    constructor(maxEventsInMemory = 10000) {
        this.maxEventsInMemory = maxEventsInMemory;
    }
    recordEvent(event) {
        this.events.push(event);
        // Keep in-memory buffer bounded
        if (this.events.length > this.maxEventsInMemory) {
            this.events = this.events.slice(-this.maxEventsInMemory);
        }
    }
    getWindowEvents(windowMs) {
        const now = Date.now();
        const cutoff = now - windowMs;
        return this.events.filter(e => {
            const eventTime = new Date(e.timestamp).getTime();
            return eventTime >= cutoff;
        });
    }
    getDailySpendUsd() {
        return this.getWindowEvents(this.windows['24h']).reduce((sum, e) => sum + e.costUsd, 0);
    }
    getHourlySpendUsd() {
        return this.getWindowEvents(this.windows['1h']).reduce((sum, e) => sum + e.costUsd, 0);
    }
    getFiveMinuteSpendUsd() {
        return this.getWindowEvents(this.windows['5m']).reduce((sum, e) => sum + e.costUsd, 0);
    }
    getSpendByAgent(windowMs) {
        const window = windowMs || this.windows['24h'];
        const events = this.getWindowEvents(window);
        const byAgent = {};
        events.forEach(e => {
            byAgent[e.agentId] = (byAgent[e.agentId] || 0) + e.costUsd;
        });
        return byAgent;
    }
    getSpendByModel(windowMs) {
        const window = windowMs || this.windows['24h'];
        const events = this.getWindowEvents(window);
        const byModel = {};
        events.forEach(e => {
            byModel[e.model] = (byModel[e.model] || 0) + e.costUsd;
        });
        return byModel;
    }
    getSpendWindow(name) {
        const windowMs = this.windows[name];
        const events = this.getWindowEvents(windowMs);
        const now = new Date();
        const startTime = new Date(now.getTime() - windowMs);
        return {
            windowName: name,
            windowMs,
            totalCostUsd: events.reduce((sum, e) => sum + e.costUsd, 0),
            eventCount: events.length,
            startTime: startTime.toISOString(),
            endTime: now.toISOString()
        };
    }
    clear() {
        this.events = [];
    }
}
//# sourceMappingURL=cost_model.js.map