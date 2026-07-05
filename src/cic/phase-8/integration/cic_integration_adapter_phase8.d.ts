/**
 * Phase 8: CIC Integration Adapter
 * Coordinates all Phase 8 components in request flow
 */
import { RuntimeSignals } from '../types/cost_event';
import { CostTelemetryCollector } from '../cost/cost_telemetry_collector';
import { CostModel } from '../cost/cost_model';
import { CostForecastEngine } from '../cost/cost_forecast_engine';
import { CostPolicyEngine } from '../cost/cost_policy_engine';
import { ModelCapabilityRegistry } from '../models/model_capability_registry';
import { DynamicModelRouter } from '../models/dynamic_model_router';
export interface AuditEvent {
    type: string;
    timestamp: number;
    actor: string;
    context: Record<string, any>;
    payload: Record<string, any>;
}
export interface AuditSink {
    write(event: AuditEvent): void;
}
export interface CICRuntimeRequest {
    executeModel(modelId: string): Promise<any>;
}
export interface CICResponse {
    result: any;
    error?: Error;
}
/**
 * CIC Integration Adapter for Phase 8
 * Coordinates:
 * 1. Build RequestContext from CIC runtime
 * 2. Evaluate cost policy
 * 3. Route to model
 * 4. Execute model
 * 5. Record telemetry + audit
 */
export declare class CICIntegrationAdapterPhase8 {
    private costTelemetryCollector;
    private costModel;
    private costForecastEngine;
    private costPolicyEngine;
    private modelRegistry;
    private dynamicModelRouter;
    private auditSink;
    private fallbackModelId;
    constructor(costTelemetryCollector: CostTelemetryCollector, costModel: CostModel, costForecastEngine: CostForecastEngine, costPolicyEngine: CostPolicyEngine, modelRegistry: ModelCapabilityRegistry, dynamicModelRouter: DynamicModelRouter, auditSink: AuditSink, fallbackModelId?: string);
    /**
     * Handle CIC request with Phase 8 cost + routing
     * @param cicRequest CIC runtime request
     * @param phaseSevenSignals Runtime signals from Phase 7
     * @returns CICResponse with model execution result
     */
    handleRequest(cicRequest: CICRuntimeRequest, phaseSevenSignals: RuntimeSignals): Promise<CICResponse>;
    /**
     * Build RequestContext from CIC request
     * @private
     */
    private buildRequestContext;
    /**
     * Build CostEvent from context + routing + result
     * @private
     */
    private buildCostEvent;
    /**
     * Build audit event for cost policy decision
     * @private
     */
    private buildPolicyAuditEvent;
    /**
     * Build audit event for model routing decision
     * @private
     */
    private buildRoutingAuditEvent;
}
//# sourceMappingURL=cic_integration_adapter_phase8.d.ts.map