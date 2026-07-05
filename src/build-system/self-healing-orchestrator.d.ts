import { FailureDetector, FailureEvent } from './failure-detector';
import { AutoRestartEngine } from './auto-restart-engine';
import { AutoRepairEngine, RepairAction } from './auto-repair-engine';
import { StateRecoveryManager } from './state-recovery-manager';
import { OrchestratorState, EventSink } from './self-healing-events';
import { MetricsRegistry } from './self-healing-metrics';
import { StateMachineLogger } from './state-machine-logger';
export interface OrchestratorConfig {
    anomalyThreshold: number;
}
export interface OrchestratorContext {
    buildId: string;
    nodeId: string;
    nodeRetryCount: number;
    buildRetryCount: number;
    failureEvent?: FailureEvent;
    repairActionsApplied: RepairAction[];
    repairHooks: Omit<import('./auto-repair-engine').RepairExecutionContext, 'buildId' | 'nodeId'>;
}
export type NodeExecutor = () => Promise<unknown>;
export declare class SelfHealingOrchestrator {
    private readonly failureDetector;
    private readonly autoRestartEngine;
    private readonly autoRepairEngine;
    private readonly stateRecoveryManager;
    private readonly eventSink;
    private readonly metrics;
    private readonly config;
    private readonly logger?;
    private state;
    private readonly failureEvents;
    constructor(failureDetector: FailureDetector, autoRestartEngine: AutoRestartEngine, autoRepairEngine: AutoRepairEngine, stateRecoveryManager: StateRecoveryManager, eventSink: EventSink, metrics: MetricsRegistry, config: OrchestratorConfig, logger?: StateMachineLogger | undefined);
    getState(): OrchestratorState;
    getRestarter(): AutoRestartEngine;
    getRepairer(): AutoRepairEngine;
    getRecovery(): StateRecoveryManager;
    getFailureEvents(): FailureEvent[];
    private transitionTo;
    runNode(ctx: OrchestratorContext, executeNode: NodeExecutor): Promise<unknown>;
    private escalate;
    requestManualIntervention(ctx: OrchestratorContext, owner?: string): Promise<void>;
    private delay;
}
//# sourceMappingURL=self-healing-orchestrator.d.ts.map