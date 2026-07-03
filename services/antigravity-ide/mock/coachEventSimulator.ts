import { CoachEvent, DriftContributor, ReadinessBreakdown } from "../events";

export class CoachEventSimulator {
  private listeners: ((event: CoachEvent) => void)[] = [];

  onEvent(cb: (event: CoachEvent) => void) {
    this.listeners.push(cb);
  }

  emit(event: CoachEvent) {
    this.listeners.forEach(cb => cb(event));
  }

  simulateRouting(messages: any[]) {
    this.emit({ type: "ROUTING_DECISION", messages });
  }

  simulateReadiness(
    value: number,
    priorValue?: number,
    breakdown?: ReadinessBreakdown
  ) {
    this.emit({
      type: "READINESS_UPDATE",
      readinessIndex: value,
      priorReadinessIndex: priorValue,
      breakdown,
      primaryDrivenBy: breakdown ? this.computePrimaryDriver(breakdown) : undefined,
    });
  }

  simulateDrift(value: number, contributors: DriftContributor[]) {
    this.emit({ type: "DRIFT_ALERT", driftIndex: value, contributors });
  }

  simulateRuleViolation(
    ruleId: string,
    description: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'warning',
    affectedCount: number = 1,
    suggestion?: string
  ) {
    this.emit({
      type: "RULE_VIOLATION",
      ruleId,
      description,
      severity,
      affectedCount,
      suggestion,
    });
  }

  private computePrimaryDriver(breakdown: ReadinessBreakdown):
    | 'discipline'
    | 'context'
    | 'review'
    | 'reuse'
    | 'drift'
  {
    const weights = {
      discipline: breakdown.promptDiscipline * 0.35,
      context: breakdown.contextHealth * 0.3,
      review: breakdown.reviewRigor * 0.25,
      reuse: breakdown.skillReuse * 0.1,
      drift: breakdown.driftIndex * -0.3,
    };
    return Object.entries(weights).reduce((a, b) =>
      Math.abs(b[1]) > Math.abs(a[1]) ? [b[0], b[1]] : [a[0], a[1]]
    )[0] as any;
  }
}
