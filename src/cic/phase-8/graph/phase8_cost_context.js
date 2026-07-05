/**
 * Phase 8: Cost Context Provider
 * Integrates Phase 8 cost model + policy into GraphContext
 */
/**
 * Cost context provider: bridges Phase 8 cost system with GraphContext
 * - Exposes soft/hard ceilings as constraints
 * - Exposes SLA targets from model registry
 * - Tracks policy decisions as audit trails
 */
export class Phase8CostContextProvider {
    costModel;
    costPolicyEngine;
    modelRegistry;
    constructor(costModel, costPolicyEngine, modelRegistry) {
        this.costModel = costModel;
        this.costPolicyEngine = costPolicyEngine;
        this.modelRegistry = modelRegistry;
    }
    /**
     * Build cost-aware knowledge graph slice
     * - Add budget constraints
     * - Add SLA constraints from model registry
     * - Add policy audit trail
     */
    buildCostKnowledgeSlice(softCeilingUsd, hardCeilingUsd) {
        // TODO: Implement knowledge slice building
        // 1. Create cost constraints:
        //    - softCeiling: { name: 'budget.soft_ceiling', value: `${softCeilingUsd}` }
        //    - hardCeiling: { name: 'budget.hard_ceiling', value: `${hardCeilingUsd}` }
        //
        // 2. Extract SLA targets from model registry:
        //    - For each registered model:
        //      - Create SLANode { name: modelId, targetMs: avgLatencyMs }
        //
        // 3. Build constraints array with cost + SLA nodes
        //
        // 4. Return partial KnowledgeGraphSlice with constraints + slas
        return {
            constraints: [],
            slas: [],
        };
    }
    /**
     * Get current spend vs budget (for visibility in GraphContext)
     */
    getSpendStatus() {
        // TODO: Implement
        // - dailySpend = costModel.getDailySpendUsd()
        // - Calculate percentages
        // - Return status object
        return {
            dailySpend: 0,
            softCeiling: 0,
            hardCeiling: 0,
            percentOfSoftCeiling: 0,
            percentOfHardCeiling: 0,
        };
    }
    /**
     * Get cost policy audit trail for graph
     * Returns structured audit events suitable for ChangeTimeline
     */
    getPolicyAuditTrail() {
        // TODO: Implement
        // - Query audit sink for Phase 8 events
        // - Transform to ChangeEvent format
        // - Return sorted by timestamp (descending)
        return [];
    }
    /**
     * Graph query helper: which models are SLA-compliant?
     */
    getSLACompliantModels(maxLatencyMs) {
        // TODO: Implement
        // - Get all models from registry
        // - Filter by avgLatencyMs <= maxLatencyMs
        // - Return model IDs
        return [];
    }
    /**
     * Graph query helper: cost-optimal model for operation
     */
    getCostOptimalModel(operationType) {
        // TODO: Implement
        // - Get candidates for operationType
        // - Sort by costInputPerMTokenUsd ascending
        // - Return cheapest model ID
        return null;
    }
}
//# sourceMappingURL=phase8_cost_context.js.map