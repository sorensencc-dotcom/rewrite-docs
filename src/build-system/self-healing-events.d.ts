import { FailureEvent } from './failure-detector';
import { RepairAction } from './auto-repair-engine';
export type OrchestratorState = 'RUNNING' | 'DETECTING' | 'CLASSIFYING' | 'ATTEMPTING_REPAIR' | 'VALIDATING' | 'ESCALATING' | 'MANUAL_INTERVENTION';
export interface EscalationEvent {
    type: 'ESCALATION';
    buildId: string;
    nodeId: string;
    state: OrchestratorState;
    failure: FailureEvent;
    repairActionsApplied: RepairAction[];
    nodeRetryCount: number;
    buildRetryCount: number;
    timestamp: string;
    escalationReason: string;
    suggestedNextSteps?: string;
}
export interface ManualInterventionEvent {
    type: 'MANUAL_INTERVENTION';
    buildId: string;
    nodeId: string;
    failure: FailureEvent;
    repairActionsApplied: RepairAction[];
    nodeRetryCount: number;
    buildRetryCount: number;
    timestamp: string;
    owner?: string;
    notes?: string;
}
export type SelfHealingEvent = EscalationEvent | ManualInterventionEvent;
export interface EventSink {
    emit(event: SelfHealingEvent): Promise<void>;
}
//# sourceMappingURL=self-healing-events.d.ts.map