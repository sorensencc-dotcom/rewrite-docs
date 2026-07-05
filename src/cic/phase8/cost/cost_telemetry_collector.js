/**
 * Phase 8: Cost Telemetry Collector
 * Collects and buffers cost events, publishes to metric sink.
 */
export class CostTelemetryCollector {
    config;
    buffer = [];
    auditBuffer = [];
    flushInterval = null;
    totalCostUsd = 0;
    constructor(config) {
        this.config = config;
        if (config.flushIntervalMs > 0) {
            this.flushInterval = setInterval(() => this.flush(), config.flushIntervalMs);
        }
    }
    recordCostEvent(event) {
        this.buffer.push(event);
        this.totalCostUsd += event.costUsd;
        if (this.buffer.length >= this.config.bufferSize) {
            this.flush();
        }
    }
    recordAuditEvent(event) {
        this.auditBuffer.push(event);
        if (this.auditBuffer.length >= Math.max(10, this.config.bufferSize / 2)) {
            this.flushAudit();
        }
    }
    flush() {
        if (this.buffer.length === 0)
            return;
        const events = [...this.buffer];
        this.buffer = [];
        // Publish to sink (implementation depends on config.sink)
        this.publishEvents(events);
    }
    flushAudit() {
        if (this.auditBuffer.length === 0)
            return;
        const events = [...this.auditBuffer];
        this.auditBuffer = [];
        // Publish to sink
        this.publishAuditEvents(events);
    }
    publishEvents(events) {
        // Sink-specific publication logic
        switch (this.config.sink) {
            case 'prometheus':
                this.publishPrometheus(events);
                break;
            case 'cloudwatch':
                this.publishCloudWatch(events);
                break;
            case 'datadog':
                this.publishDatadog(events);
                break;
            case 'mock':
                // No-op for tests
                break;
        }
    }
    publishAuditEvents(events) {
        // Audit event routing (typically to audit log or separate sink)
        switch (this.config.sink) {
            case 'prometheus':
                // Count audit events in metrics
                events.forEach(e => {
                    // Counter increment: cic_audit_events_total{type=e.eventType}
                });
                break;
        }
    }
    publishPrometheus(events) {
        // Update Prometheus metrics
        events.forEach(e => {
            // cic_cost_total_usd += e.costUsd
            // cic_cost_request_usd{agent=e.agentId, model=e.model} += e.costUsd
            // cic_cost_input_tokens += e.inputTokens
            // cic_cost_output_tokens += e.outputTokens
            // cic_cost_daily_spend_usd (rolling 24h window)
        });
    }
    publishCloudWatch(events) {
        // CloudWatch metrics publication
    }
    publishDatadog(events) {
        // Datadog metrics publication
    }
    getTotalCostUsd() {
        return this.totalCostUsd;
    }
    getBufferSize() {
        return this.buffer.length;
    }
    async shutdown() {
        this.flush();
        this.flushAudit();
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
    }
}
//# sourceMappingURL=cost_telemetry_collector.js.map