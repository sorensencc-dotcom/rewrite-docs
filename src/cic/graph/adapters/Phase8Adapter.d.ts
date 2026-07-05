/**
 * Phase 8: Graph Adapter
 * Wraps CICIntegrationAdapterPhase8 as a GraphContext adapter.
 * Provides cost optimization signals for merged context.
 */
import { CostOptimizationSlice } from '../GraphContext.js';
export declare class Phase8Adapter {
    private static instance;
    private static getInstance;
    /**
     * Get cost optimization signals for a service.
     * Used when merging context for cost-aware routing decisions.
     */
    static getCostOptimizationSignals(service: string): Promise<CostOptimizationSlice>;
}
//# sourceMappingURL=Phase8Adapter.d.ts.map