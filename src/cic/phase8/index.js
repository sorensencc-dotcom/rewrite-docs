/**
 * Phase 8: Cost Optimization + Dynamic Model Selection
 * Unified export surface for all Phase 8 modules.
 */
// Type exports
export { validateRequestContext } from './types/request_context.js';
export { calculateModelCost, estimateCost } from './types/model_descriptor.js';
// Cost intelligence exports
export { CostTelemetryCollector } from './cost/cost_telemetry_collector.js';
export { CostModel } from './cost/cost_model.js';
export { CostForecastEngine } from './cost/cost_forecast_engine.js';
export { CostPolicyEngine } from './cost/cost_policy_engine.js';
// Model intelligence exports
export { ModelCapabilityRegistry } from './models/model_capability_registry.js';
export { DynamicModelRouter } from './models/dynamic_model_router.js';
// Integration exports
export { CICIntegrationAdapterPhase8 } from './integration/cic_integration_adapter_phase8.js';
//# sourceMappingURL=index.js.map