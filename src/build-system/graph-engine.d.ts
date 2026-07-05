import { BuildGraph, BuildExecutionPlan, BuildProvenance } from './types';
import { LineageRegistry } from './lineage-registry';
import { RoutingEngine } from './routing-engine';
import { DriftDetector } from './drift-detector';
import { SelfHealingOrchestrator } from './self-healing-orchestrator';
export declare class BuildGraphEngine {
    private graph;
    private lineage;
    private routing;
    private drift;
    private executionContexts;
    private orchestrator;
    constructor(graph: BuildGraph);
    getSelfHealingOrchestrator(): SelfHealingOrchestrator;
    getNodeLayer(nodeId: string): number;
    validateGraph(): {
        valid: boolean;
        errors: string[];
    };
    createExecutionPlan(build_id: string): BuildExecutionPlan;
    executeNode(nodeId: string, build_id: string, provenance: BuildProvenance): Promise<{
        success: boolean;
        error?: Error | null;
    }>;
    executeNodeWithSelfHealing(nodeId: string, build_id: string, provenance: BuildProvenance): Promise<{
        success: boolean;
        error?: Error | null;
    }>;
    executePlan(plan: BuildExecutionPlan, provenance: BuildProvenance): Promise<{
        success: boolean;
        errors: Error[];
    }>;
    getLineageRegistry(): LineageRegistry;
    getRoutingEngine(): RoutingEngine;
    getDriftDetector(): DriftDetector;
    private topologicalSort;
    private hasCycle;
    private getExecutionLayer;
}
//# sourceMappingURL=graph-engine.d.ts.map