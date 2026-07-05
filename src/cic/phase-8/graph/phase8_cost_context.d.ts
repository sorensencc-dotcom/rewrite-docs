/**
 * Phase 8: Cost Context Provider
 * Integrates Phase 8 cost model + policy into GraphContext
 */
import { KnowledgeGraphSlice, ConstraintNode } from '../../graph/GraphContext';
import { CostModel } from '../cost/cost_model';
import { CostPolicyEngine } from '../cost/cost_policy_engine';
import { ModelCapabilityRegistry } from '../models/model_capability_registry';
/**
 * Cost constraint node extending base Constraint
 */
export interface CostConstraintNode extends ConstraintNode {
    type: 'budget' | 'sla' | 'policy';
    category: 'soft_ceiling' | 'hard_ceiling' | 'latency_sla' | 'quality_tier';
    value: string;
}
/**
 * Cost context provider: bridges Phase 8 cost system with GraphContext
 * - Exposes soft/hard ceilings as constraints
 * - Exposes SLA targets from model registry
 * - Tracks policy decisions as audit trails
 */
export declare class Phase8CostContextProvider {
    private costModel;
    private costPolicyEngine;
    private modelRegistry;
    constructor(costModel: CostModel, costPolicyEngine: CostPolicyEngine, modelRegistry: ModelCapabilityRegistry);
    /**
     * Build cost-aware knowledge graph slice
     * - Add budget constraints
     * - Add SLA constraints from model registry
     * - Add policy audit trail
     */
    buildCostKnowledgeSlice(softCeilingUsd: number, hardCeilingUsd: number): Partial<KnowledgeGraphSlice>;
    /**
     * Get current spend vs budget (for visibility in GraphContext)
     */
    getSpendStatus(): {
        dailySpend: number;
        softCeiling: number;
        hardCeiling: number;
        percentOfSoftCeiling: number;
        percentOfHardCeiling: number;
    };
    /**
     * Get cost policy audit trail for graph
     * Returns structured audit events suitable for ChangeTimeline
     */
    getPolicyAuditTrail(): Array<{
        eventId: string;
        timestamp: string;
        type: string;
        message: string;
    }>;
    /**
     * Graph query helper: which models are SLA-compliant?
     */
    getSLACompliantModels(maxLatencyMs: number): string[];
    /**
     * Graph query helper: cost-optimal model for operation
     */
    getCostOptimalModel(operationType: string): string | null;
}
//# sourceMappingURL=phase8_cost_context.d.ts.map