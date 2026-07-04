/**
 * Phase 8: Cost Events, Decisions, and Signals
 * Defines cost telemetry events, policy decisions, and runtime signals merged from Phase 7 + Phase 8.
 */

export interface CostEvent {
  requestId: string;
  timestamp: string; // ISO8601
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
  timestamp: string; // ISO8601
  decision: PolicyDecisionType;
  reason: string;
  suggestedModel?: string; // if DOWNGRADE
  deferMs?: number; // if QUEUE
}

export type CostPressureLevel = 'normal' | 'warning' | 'critical';
export type BudgetStatus = 'healthy' | 'approaching' | 'soft_ceiling' | 'hard_ceiling';
export type DegradationState = 'active' | 'recovery' | 'normal';

export interface RuntimeSignals {
  // Phase 7 signals
  slaStatus: 'on_track' | 'at_risk' | 'violated';
  slaMarginMs: number;
  modelSelection: 'primary' | 'fallback' | 'emergency';

  // Phase 8 signals
  costPressureLevel: CostPressureLevel;
  budgetStatus: BudgetStatus;
  anomalyScore: number; // 0-1
  degradationState: DegradationState;
  costForecastUsd: number;
  costForecastHours: number;
}

export type AuditEventType =
  | 'COST_POLICY_DECISION'
  | 'MODEL_ROUTING_DECISION'
  | 'COST_DEGRADATION_ENTERED'
  | 'COST_HARD_CEILING_ENFORCED'
  | 'COST_RECOVERY_STARTED'
  | 'COST_RECOVERY_COMPLETE'
  | 'COST_ANOMALY_DETECTED';

export interface AuditEvent {
  eventType: AuditEventType;
  timestamp: string; // ISO8601
  requestId?: string;
  agentId?: string;
  details: Record<string, unknown>;
}
