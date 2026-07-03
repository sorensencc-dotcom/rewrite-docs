import { RuleContext, AgenticRule, RuleFinding } from './types';
import { computeMetrics } from '../metrics';
import { createHash } from 'crypto';

export class RuleEngine {
  private rules: AgenticRule[];

  constructor(rules: AgenticRule[]) {
    this.rules = rules;
  }

  evaluate(ctx: RuleContext) {
    const findings: RuleFinding[] = [];

    for (const rule of this.rules) {
      try {
        const result = rule.evaluate(ctx);

        // Normalize rule output
        for (const f of result) {
          // Deterministic ID: hash of rule + finding content
          const findingKey = `${rule.id}|${f.severity ?? 'info'}|${f.message}|${f.sessionRequestId ?? ''}`;
          const hash = createHash('sha256').update(findingKey).digest('hex').slice(0, 12);
          findings.push({
            id: f.id ?? `finding-${rule.id}-${hash}`,
            ruleId: rule.id,
            severity: f.severity ?? 'info',
            message: f.message,
            advice: f.advice,
            sessionId: f.sessionId,
            sessionRequestId: f.sessionRequestId,
          });
        }
      } catch (err) {
        // Rule failure is itself a critical finding
        findings.push({
          id: `error-${rule.id}`,
          ruleId: rule.id,
          severity: 'critical',
          message: `Rule execution failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    const metrics = computeMetrics(ctx, findings);

    return { findings, metrics };
  }
}
