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
  // Phase 7 signals
  driftScore: number; // 0–1
  sla: SLAMetrics;
  circuitBreakerState: CircuitBreakerState;

  // Phase 8 signals (NEW)
  costPressureLevel: CostPressureLevel;
  budgetStatus: BudgetStatus;
  anomalyScore: number; // 0–1, from forecast engine
  dailySpendUsd: number;
  hardCeilingUsd: number;
}

/** State machine transition */
export interface StateTransition {
  fromState: RuntimeState;
  toState: RuntimeState;
  trigger: string; // e.g., 'COST_DEGRADATION_ENTERED', 'COST_RECOVERY_COMPLETED'
  timestamp: number;
  signals: RuntimeSignals;
}

/**
 * Validate CostEvent for required fields
 * @throws Error if validation fails
 */
export function validateCostEvent(event: CostEvent): void {
  // TODO: Implement validation
  // - Validate required fields present
  // - Validate token counts >= 0
  // - Validate totalCostUsd >= 0
  // - Validate timestamp > 0
}

/**
 * Derive cost pressure level from policy decision
 */
export function deriveCostPressureLevel(decision: PolicyDecision): CostPressureLevel {
  // TODO: Implement mapping
  // ALLOW -> LOW
  // DOWNGRADE -> MEDIUM
  // BLOCK -> HIGH
  return 'LOW';
}
