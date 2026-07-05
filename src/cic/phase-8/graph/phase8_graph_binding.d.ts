/**
 * Phase 8: GraphContext Binding
 * Wires Phase 8 stubs to consume/produce GraphContext data
 */
import { RequestContext } from '../types/request_context';
import { CICIntegrationAdapterPhase8 } from '../integration/cic_integration_adapter_phase8';
import { Phase8CostContextProvider } from './phase8_cost_context';
import { GraphContext, GraphContextAPI } from '../../graph/GraphContext';
/**
 * Phase 8 GraphContext binding
 * - Extends RequestContext with GraphContext constraints
 * - Validates routing decisions against GraphContext policy
 * - Records routing decisions back to GraphContext audit trail
 */
export declare class Phase8GraphBinding {
    private graphContextAPI;
    private costContextProvider;
    private adapter;
    constructor(graphContextAPI: GraphContextAPI, costContextProvider: Phase8CostContextProvider, adapter: CICIntegrationAdapterPhase8);
    /**
     * Enrich RequestContext with cost constraints from GraphContext
     * @param context Base request context
     * @returns RequestContext with cost constraints applied
     */
    enrichContextWithCostConstraints(context: RequestContext): Promise<RequestContext>;
    /**
     * Validate routing decision against GraphContext policy
     * Ensures routing complies with documented architecture + constraints
     */
    validateRoutingAgainstPolicy(context: RequestContext, selectedModelId: string, graphContext: GraphContext): Promise<{
        valid: boolean;
        reason: string;
    }>;
    /**
     * Record routing decision to GraphContext audit trail
     * Enables retrospective analysis of cost optimization decisions
     */
    recordRoutingDecision(context: RequestContext, selectedModelId: string, decision: string, cost: number): Promise<void>;
    /**
     * Resolve cost optimization targets from GraphContext
     * Reads ADRs + constraints to understand cost optimization intentions
     */
    resolveCostOptimizationTargets(graphContext: GraphContext): Promise<{
        softCeiling: number;
        hardCeiling: number;
        strategy: string;
    }>;
    /**
     * Query: which models comply with documented SLA?
     * Returns SLA-compliant model subset for routing
     */
    querySLACompliantModels(graphContext: GraphContext): Promise<string[]>;
}
//# sourceMappingURL=phase8_graph_binding.d.ts.map