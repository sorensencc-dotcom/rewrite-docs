/**
 * Phase 8: CIC Integration Adapter
 * Orchestrates cost optimization pipeline: telemetry → model → forecast → policy → routing.
 * Integrates with GraphContext to bind cost signals for Phase 7 + Phase 8 co-design.
 */
import { RequestContext } from '../types/request_context.js';
import { RuntimeSignals, CostEvent } from '../types/cost_event.js';
import { CostPolicyConfig } from '../cost/cost_policy_engine.js';
import { ModelDescriptor } from '../types/model_descriptor.js';
export interface Phase8Config {
    telemetrySink: 'prometheus' | 'cloudwatch' | 'datadog' | 'mock';
    costPolicyConfig: CostPolicyConfig;
    modelRegistry: ModelDescriptor[];
    enableAudit: boolean;
}
export interface Phase8RoutingResult {
    requestId: string;
    selectedModel: ModelDescriptor;
    estimatedCostUsd: number;
    runtimeSignals: RuntimeSignals;
    reason: string;
    routingScore: number;
}
export declare class CICIntegrationAdapterPhase8 {
    private config;
    private telemetryCollector;
    private costModel;
    private forecastEngine;
    private policyEngine;
    private registry;
    private router;
    constructor(config: Phase8Config);
    /**
     * Main entry point: receives request, computes cost signals, routes to model.
     * Integrates Phase 7 SLA signals with Phase 8 cost signals.
     */
    handleRequest(requestContext: RequestContext, phase7Signals: Partial<RuntimeSignals>): Promise<Phase8RoutingResult>;
    /**
     * Called after request completion to record actual cost.
     */
    recordActualCost(event: CostEvent): void;
    private recordAuditEvent;
    private publishMetric;
    getDailySpendUsd(): number;
    getSpendByModel(): Record<string, number>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=cic_integration_adapter_phase8.d.ts.map