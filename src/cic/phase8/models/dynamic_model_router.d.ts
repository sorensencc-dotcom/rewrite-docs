/**
 * Phase 8: Dynamic Model Router
 * Routes requests to models based on cost policy, SLA signals, and capability matching.
 */
import { RequestContext } from '../types/request_context.js';
import { RuntimeSignals } from '../types/cost_event.js';
import { ModelDescriptor } from '../types/model_descriptor.js';
import { ModelCapabilityRegistry } from './model_capability_registry.js';
import { CostPolicyResult } from '../cost/cost_policy_engine.js';
export interface RoutingDecision {
    selectedModel: ModelDescriptor;
    reason: string;
    alternativeModels: ModelDescriptor[];
    score: number;
}
export interface RoutingContext {
    requestContext: RequestContext;
    signals: RuntimeSignals;
    policyDecision: CostPolicyResult;
}
export declare class DynamicModelRouter {
    private registry;
    constructor(registry: ModelCapabilityRegistry);
    route(context: RoutingContext): RoutingDecision;
    private routeNormal;
    private routeDowngrade;
    private routeQueuedRequest;
    private getAlternatives;
}
//# sourceMappingURL=dynamic_model_router.d.ts.map