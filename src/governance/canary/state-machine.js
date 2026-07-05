/**
 * Canary Governance State Machine
 * Phase 5: Deterministic canary lifecycle with lineage tracking
 * All state writes go through this machine → canary_state_history
 */
import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";
import { recordUnifiedEvent } from "../lineage/unified-lineage";
/**
 * Canary state machine: deterministic state transitions.
 * Only place where canary_state_history is written.
 */
export class CanaryStateMachine {
    static async transitionState(transition) {
        // Validate transition
        this.validateTransition(transition.toState);
        // Write to state history (append-only)
        await pgQuery(`INSERT INTO canary_state_history (proposal_id, state, version, previous_version, snapshot, recorded_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, [
            transition.proposalId,
            transition.toState,
            transition.version,
            transition.previousVersion ?? null,
            transition.snapshot ? JSON.stringify(transition.snapshot) : null,
        ]);
        // Emit unified lineage event
        await recordUnifiedEvent({
            event_type: this.mapStateToEventType(transition.toState),
            source_system: "governance",
            entity_id: transition.proposalId,
            entity_type: "proposal",
            payload: {
                fromState: transition.fromState,
                toState: transition.toState,
                version: transition.version,
            },
        });
    }
    /**
     * Get current state of a proposal.
     */
    static async getCurrentState(proposalId) {
        const rows = await pgQuery(`SELECT state FROM canary_state_history
       WHERE proposal_id = $1
       ORDER BY recorded_at DESC LIMIT 1`, [proposalId]);
        return rows.length > 0 ? rows[0].state : null;
    }
    /**
     * Get full state history for a proposal.
     */
    static async getStateHistory(proposalId) {
        const rows = await pgQuery(`SELECT state, version, previous_version, snapshot, recorded_at
       FROM canary_state_history
       WHERE proposal_id = $1
       ORDER BY recorded_at ASC`, [proposalId]);
        return rows.map((row) => ({
            proposalId,
            fromState: null, // Reconstructed from sequence
            toState: row.state,
            version: row.version,
            previousVersion: row.previous_version,
            snapshot: row.snapshot ? JSON.parse(row.snapshot) : undefined,
        }));
    }
    static validateTransition(toState) {
        const validStates = [
            "canary_pending_governance",
            "canary_active_governance",
            "canary_violation_detected",
            "canary_governance_retry",
            "canary_governance_rollback",
            "canary_governance_promote",
        ];
        if (!validStates.includes(toState)) {
            throw new Error(`Invalid canary state: ${toState}`);
        }
    }
    static mapStateToEventType(state) {
        const mapping = {
            canary_pending_governance: "validate",
            canary_active_governance: "canary_start",
            canary_violation_detected: "violation",
            canary_governance_retry: "retry",
            canary_governance_rollback: "rollback",
            canary_governance_promote: "promote",
        };
        return mapping[state];
    }
}
//# sourceMappingURL=state-machine.js.map