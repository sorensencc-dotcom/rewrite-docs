/**
 * Phase 8: Cost Events, Decisions, and Signals
 * Defines cost telemetry events, policy decisions, and runtime signals merged from Phase 7 + Phase 8.
 */
export interface CostEvent {
    requestId: string;
    timestamp: string;
    agentId: string;
    serviceId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    latencyMs: number;
}
export type PolicyDecisionType = 'ALLOW' | 'DOWNGRADE' | 'BLOCK' | 'QUEUE';
export interface PolicyDecision {
    requestId: string;
    timestamp: string;
    decision: PolicyDecisionType;
    reason: string;
    suggestedModel?: string;
    deferMs?: number;
}
export type CostPressureLevel = 'normal' | 'warning' | 'critical';
export type BudgetStatus = 'healthy' | 'approaching' | 'soft_ceiling' | 'hard_ceiling';
export type DegradationState = 'active' | 'recovery' | 'normal';
export interface RuntimeSignals {
    slaStatus: 'on_track' | 'at_risk' | 'violated';
    slaMarginMs: number;
    modelSelection: 'primary' | 'fallback' | 'emergency';
    costPressureLevel: CostPressureLevel;
    budgetStatus: BudgetStatus;
    anomalyScore: number;
    degradationState: DegradationState;
    costForecastUsd: number;
    costForecastHours: number;
}
export type AuditEventType = 'COST_POLICY_DECISION' | 'MODEL_ROUTING_DECISION' | 'COST_DEGRADATION_ENTERED' | 'COST_HARD_CEILING_ENFORCED' | 'COST_RECOVERY_STARTED' | 'COST_RECOVERY_COMPLETE' | 'COST_ANOMALY_DETECTED';
export interface AuditEvent {
    eventType: AuditEventType;
    timestamp: string;
    requestId?: string;
    agentId?: string;
    details: Record<string, unknown>;
}
//# sourceMappingURL=cost_event.d.ts.map