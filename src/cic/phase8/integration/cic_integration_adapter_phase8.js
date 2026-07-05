/**
 * Phase 8: CIC Integration Adapter
 * Orchestrates cost optimization pipeline: telemetry → model → forecast → policy → routing.
 * Integrates with GraphContext to bind cost signals for Phase 7 + Phase 8 co-design.
 */
import { validateRequestContext } from '../types/request_context.js';
import { CostTelemetryCollector } from '../cost/cost_telemetry_collector.js';
import { CostModel } from '../cost/cost_model.js';
import { CostForecastEngine } from '../cost/cost_forecast_engine.js';
import { CostPolicyEngine } from '../cost/cost_policy_engine.js';
import { ModelCapabilityRegistry } from '../models/model_capability_registry.js';
import { DynamicModelRouter } from '../models/dynamic_model_router.js';
import { calculateModelCost } from '../types/model_descriptor.js';
export class CICIntegrationAdapterPhase8 {
    config;
    telemetryCollector;
    costModel;
    forecastEngine;
    policyEngine;
    registry;
    router;
    constructor(config) {
        this.config = config;
        // Initialize cost pipeline
        this.telemetryCollector = new CostTelemetryCollector({
            sink: config.telemetrySink,
            bufferSize: 100,
            flushIntervalMs: 5000
        });
        this.costModel = new CostModel(10000);
        this.forecastEngine = new CostForecastEngine(this.costModel, 0.75);
        this.policyEngine = new CostPolicyEngine(this.costModel, config.costPolicyConfig);
        // Initialize model registry
        this.registry = new ModelCapabilityRegistry();
        config.modelRegistry.forEach(m => this.registry.register(m));
        // Initialize router
        this.router = new DynamicModelRouter(this.registry);
        this.publishMetric('cic_phase8_initialized', 1);
    }
    /**
     * Main entry point: receives request, computes cost signals, routes to model.
     * Integrates Phase 7 SLA signals with Phase 8 cost signals.
     */
    async handleRequest(requestContext, phase7Signals) {
        // Validate request
        if (!validateRequestContext(requestContext)) {
            throw new Error('Invalid request context');
        }
        // Get current cost state
        const dailySpend = this.costModel.getDailySpendUsd();
        const forecast = this.forecastEngine.forecast(24);
        // Estimate cost for this request
        const estimatedModel = this.registry.getPrimaryModel();
        if (!estimatedModel) {
            throw new Error('No models available');
        }
        const estimatedCostUsd = calculateModelCost(estimatedModel, requestContext.estimatedInputTokens, requestContext.estimatedOutputTokens);
        // Evaluate cost policy
        const policyResult = this.policyEngine.evaluatePolicy(dailySpend, forecast, estimatedCostUsd);
        // Merge Phase 7 + Phase 8 signals
        const runtimeSignals = {
            slaStatus: phase7Signals.slaStatus || 'on_track',
            slaMarginMs: phase7Signals.slaMarginMs || 0,
            modelSelection: phase7Signals.modelSelection || 'primary',
            costPressureLevel: policyResult.costPressureLevel,
            budgetStatus: policyResult.budgetStatus,
            anomalyScore: forecast.anomalyScore,
            degradationState: phase7Signals.degradationState || 'normal',
            costForecastUsd: forecast.projectedDailySpendUsd,
            costForecastHours: forecast.forecastHours
        };
        // Route to model
        const routingDecision = this.router.route({
            requestContext,
            signals: runtimeSignals,
            policyDecision: policyResult
        });
        // Record audit event if enabled
        if (this.config.enableAudit) {
            this.recordAuditEvent({
                eventType: 'MODEL_ROUTING_DECISION',
                timestamp: new Date().toISOString(),
                requestId: requestContext.requestId,
                agentId: requestContext.agentId,
                details: {
                    selectedModel: routingDecision.selectedModel.id,
                    estimatedCostUsd,
                    policyDecision: policyResult.decision,
                    reason: routingDecision.reason,
                    score: routingDecision.score
                }
            });
        }
        // Publish metrics
        this.publishMetric('cic_cost_request_usd', estimatedCostUsd, {
            agent: requestContext.agentId,
            model: routingDecision.selectedModel.id,
            tier: routingDecision.selectedModel.tier
        });
        this.publishMetric('cic_cost_budget_soft_ceiling_active', policyResult.budgetStatus === 'soft_ceiling' ? 1 : 0);
        this.publishMetric('cic_cost_budget_hard_ceiling_active', policyResult.budgetStatus === 'hard_ceiling' ? 1 : 0);
        this.publishMetric('cic_cost_anomaly_score', forecast.anomalyScore);
        return {
            requestId: requestContext.requestId,
            selectedModel: routingDecision.selectedModel,
            estimatedCostUsd,
            runtimeSignals,
            reason: routingDecision.reason,
            routingScore: routingDecision.score
        };
    }
    /**
     * Called after request completion to record actual cost.
     */
    recordActualCost(event) {
        this.costModel.recordEvent(event);
        this.telemetryCollector.recordCostEvent(event);
        // Publish cost metrics
        this.publishMetric('cic_cost_total_usd', event.costUsd);
        this.publishMetric('cic_cost_input_tokens', event.inputTokens);
        this.publishMetric('cic_cost_output_tokens', event.outputTokens);
        this.publishMetric('cic_cost_daily_spend_usd', this.costModel.getDailySpendUsd());
        this.publishMetric('cic_cost_model_selection_changes_total', 1, { model: event.model });
    }
    recordAuditEvent(event) {
        this.telemetryCollector.recordAuditEvent(event);
        // Also log to console for debugging
        console.log(`[AUDIT] ${event.eventType}: ${JSON.stringify(event.details)}`);
    }
    publishMetric(name, value, labels) {
        // Publish to configured sink (Prometheus, CloudWatch, Datadog, or mock)
        const labelStr = labels ? ` ${JSON.stringify(labels)}` : '';
        switch (this.config.telemetrySink) {
            case 'prometheus':
                // Prometheus format: metric_name{label="value"} numeric_value
                console.log(`[PROMETHEUS] ${name}${labelStr} ${value}`);
                break;
            case 'cloudwatch':
                console.log(`[CLOUDWATCH] ${name} = ${value}`);
                break;
            case 'datadog':
                console.log(`[DATADOG] ${name}:${value}`);
                break;
            case 'mock':
                // No-op for testing
                break;
        }
    }
    // Getters for testing and monitoring
    getDailySpendUsd() {
        return this.costModel.getDailySpendUsd();
    }
    getSpendByModel() {
        return this.costModel.getSpendByModel();
    }
    async shutdown() {
        await this.telemetryCollector.shutdown();
    }
}
//# sourceMappingURL=cic_integration_adapter_phase8.js.map