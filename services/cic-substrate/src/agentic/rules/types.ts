export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface RuleFinding {
  id: string;
  ruleId: string;
  severity: Severity;
  message: string;
  advice?: string;
  sessionId?: string;
  sessionRequestId?: string;
}

export interface RuleContext {
  sessions: any[];
  requests: any[];
  contexts: any[];
  reviews: any[];
}

export interface AgenticRule {
  id: string;
  description: string;
  evaluate(ctx: RuleContext): RuleFinding[];
}
