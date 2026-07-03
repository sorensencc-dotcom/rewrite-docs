// approval-gates.ts - State machine for human-governed promotion
import type { RoadmapItem, RoadmapItemState } from "./policy-engine";

export type StateTransition =
  | "create"         // candidate ← (none)
  | "approve"        // approved ← candidate
  | "reject"         // rejected ← candidate
  | "activate"       // active ← approved
  | "revert"         // candidate ← active (for rollback)
  | "expire";        // rejected ← candidate (after deadline)

export interface StateChange {
  itemId: string;
  from: RoadmapItemState;
  to: RoadmapItemState;
  transition: StateTransition;
  actor: string; // who made the change
  reason: string;
  timestamp: string;
}

export interface ApprovalGate {
  itemId: string;
  currentState: RoadmapItemState;
  allowedTransitions: StateTransition[];
  approval_required: boolean;
  activated_at: string | null;
  activated_by: string | null;
  history: StateChange[];
}

/**
 * State machine: valid transitions
 */
const STATE_TRANSITIONS: Record<RoadmapItemState, StateTransition[]> = {
  candidate: ["approve", "reject", "expire"],
  approved: ["activate", "reject"],
  active: ["revert"],
  rejected: [] // terminal state
};

/**
 * Determine if transition is allowed
 */
export function isTransitionAllowed(
  from: RoadmapItemState,
  transition: StateTransition
): boolean {
  return STATE_TRANSITIONS[from]?.includes(transition) ?? false;
}

/**
 * Execute state transition
 */
export function executeTransition(
  item: RoadmapItem,
  transition: StateTransition,
  actor: string,
  reason: string
): { success: boolean; newState: RoadmapItemState; error?: string } {
  // Check if transition is valid
  if (!isTransitionAllowed(item.state, transition)) {
    return {
      success: false,
      newState: item.state,
      error: `Invalid transition: ${item.state} → ${transition}`
    };
  }

  // Compute new state
  let newState: RoadmapItemState;
  switch (transition) {
    case "create":
      newState = "candidate";
      break;
    case "approve":
      newState = "approved";
      break;
    case "reject":
      newState = "rejected";
      break;
    case "activate":
      newState = "active";
      break;
    case "revert":
      newState = "candidate";
      break;
    case "expire":
      newState = "rejected";
      break;
    default:
      return {
        success: false,
        newState: item.state,
        error: `Unknown transition: ${transition}`
      };
  }

  return {
    success: true,
    newState
  };
}

/**
 * Check if item is actionable (can transition)
 */
export function isActionable(item: RoadmapItem): boolean {
  return STATE_TRANSITIONS[item.state].length > 0;
}

/**
 * Check if item requires approval before activation
 */
export function requiresApproval(item: RoadmapItem): boolean {
  return item.policy === "must-adopt" && item.blocking;
}

/**
 * Get human-readable state description
 */
export function getStateDescription(state: RoadmapItemState): string {
  switch (state) {
    case "candidate":
      return "Proposed change; waiting for review";
    case "approved":
      return "Approved by operator; waiting for activation";
    case "active":
      return "Activated; changes applied to CIC";
    case "rejected":
      return "Rejected; will not be adopted";
    default:
      return "Unknown state";
  }
}

/**
 * Get next allowed transitions
 */
export function getNextTransitions(state: RoadmapItemState): StateTransition[] {
  return STATE_TRANSITIONS[state];
}

/**
 * Format a state change for logging
 */
export function formatStateChange(change: StateChange): string {
  return `[${change.timestamp}] ${change.actor}: ${change.from} → ${change.to} (${change.transition}) — ${change.reason}`;
}

/**
 * Check if item meets activation criteria
 */
export function canActivate(item: RoadmapItem): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (item.state !== "approved") {
    reasons.push(`Current state is "${item.state}"; must be "approved"`);
  }

  // Could add additional checks:
  // - Docker image build completed?
  // - Tests passed?
  // - Slack approval from @oncall?

  return {
    allowed: reasons.length === 0,
    reasons
  };
}

/**
 * Build approval gate status for a roadmap item
 */
export function buildApprovalGate(item: RoadmapItem): ApprovalGate {
  return {
    itemId: item.id,
    currentState: item.state,
    allowedTransitions: getNextTransitions(item.state),
    approval_required: requiresApproval(item),
    activated_at: item.state === "active" ? item.updated_at : null,
    activated_by: item.state === "active" ? "system" : null,
    history: [] // Would be populated from audit log
  };
}
