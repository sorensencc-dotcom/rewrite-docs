/**
 * Phase 8: Cost Event & Policy Types
 * CostEvent, PolicyDecision, RuntimeSignals, and state transition types
 */
import { Priority } from './request_context';
export type PolicyDecision = 'ALLOW' | 'DOWNGRADE' | 'BLOCK';
export type CostPressureLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type BudgetStatus = 'WITHIN_BUDGET' | 'SOFT_CEILING' | 'HARD_CEILING';
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export type RuntimeState = 'ONLINE' | 'DEGRADED_COST' | 'DEGRADED_SLA' | 'OFFLINE_COST';
export interface CostEvent {
    id: string;
    timestamp: number;
    requestId: string;
    agentId: string;
    tenantId: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    totalCostUsd: number;
    operationType: string;
    priority: Priority;
}
export interface CostPolicyResult {
    decision: PolicyDecision;
    dailySpendUsd: number;
    softCeilingUsd: number;
    hardCeilingUsd: number;
    costPressureLevel: CostPressureLevel;
    budgetStatus: BudgetStatus;
    reason: string;
}
export interface SLAMetrics {
    p95LatencyMs: number;
    p99LatencyMs: number;
    errorRate: number;
}
/** Phase 7 + Phase 8 merged runtime signals */
export interface RuntimeSignals {
    driftScore: number;
    sla: SLAMetrics;
    circuitBreakerState: CircuitBreakerState;
    costPressureLevel: CostPressureLevel;
    budgetStatus: BudgetStatus;
    anomalyScore: number;
    dailySpendUsd: number;
    hardCeilingUsd: number;
}
/** State machine transition */
export interface StateTransition {
    fromState: RuntimeState;
    toState: RuntimeState;
    trigger: string;
    timestamp: number;
    signals: RuntimeSignals;
}
/**
 * Validate CostEvent for required fields
 * @throws Error if validation fails
 */
export declare function validateCostEvent(event: CostEvent): void;
/**
 * Derive cost pressure level from policy decision
 */
export declare function deriveCostPressureLevel(decision: PolicyDecision): CostPressureLevel;
//# sourceMappingURL=cost_event.d.ts.map