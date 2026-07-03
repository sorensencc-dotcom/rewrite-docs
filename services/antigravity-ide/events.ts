import { RoutingMessage } from "../gemini-coach/src/messaging/routingMessages";

export type CoachEventType =
  | "ROUTING_DECISION"
  | "READINESS_UPDATE"
  | "DRIFT_ALERT"
  | "RULE_VIOLATION";

export interface DriftContributor {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  explanation: string;
  count: number;
}

export interface ReadinessBreakdown {
  promptDiscipline: number;
  contextHealth: number;
  reviewRigor: number;
  skillReuse: number;
  driftIndex: number;
}

export interface RoutingDecisionEvent {
  type: "ROUTING_DECISION";
  messages: RoutingMessage[];
}

export interface ReadinessUpdateEvent {
  type: "READINESS_UPDATE";
  readinessIndex: number;
  priorReadinessIndex?: number;
  breakdown?: ReadinessBreakdown;
  primaryDrivenBy?: 'discipline' | 'context' | 'review' | 'reuse' | 'drift';
}

export interface DriftAlertEvent {
  type: "DRIFT_ALERT";
  driftIndex: number;
  contributors: DriftContributor[];
}

export interface RuleViolationEvent {
  type: "RULE_VIOLATION";
  ruleId: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  affectedCount: number;
  suggestion?: string;
}

export type CoachEvent =
  | RoutingDecisionEvent
  | ReadinessUpdateEvent
  | DriftAlertEvent
  | RuleViolationEvent;

export interface CoachWebSocketClient {
  connect(url: string): Promise<void>;
  onEvent(cb: (event: CoachEvent) => void): void;
}
