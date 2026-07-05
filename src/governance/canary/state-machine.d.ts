/**
 * Canary Governance State Machine
 * Phase 5: Deterministic canary lifecycle with lineage tracking
 * All state writes go through this machine → canary_state_history
 */
export type CanaryGovernanceState = "canary_pending_governance" | "canary_active_governance" | "canary_violation_detected" | "canary_governance_retry" | "canary_governance_rollback" | "canary_governance_promote";
export interface StateTransition {
    proposalId: string;
    fromState: CanaryGovernanceState | null;
    toState: CanaryGovernanceState;
    version: string;
    previousVersion?: string | null;
    snapshot?: Record<string, any>;
}
/**
 * Canary state machine: deterministic state transitions.
 * Only place where canary_state_history is written.
 */
export declare class CanaryStateMachine {
    static transitionState(transition: StateTransition): Promise<void>;
    /**
     * Get current state of a proposal.
     */
    static getCurrentState(proposalId: string): Promise<CanaryGovernanceState | null>;
    /**
     * Get full state history for a proposal.
     */
    static getStateHistory(proposalId: string): Promise<StateTransition[]>;
    private static validateTransition;
    private static mapStateToEventType;
}
//# sourceMappingURL=state-machine.d.ts.map