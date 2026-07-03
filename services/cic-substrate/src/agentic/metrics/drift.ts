import { clamp } from '../utils';

export interface DriftContributor {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  explanation: string;
  count: number;
}

export interface DriftAnalysis {
  driftIndex: number;
  contributors: DriftContributor[];
}

export function computeDriftIndex({
  violationRate,
  errorRate,
  contextHealth,
  findings = [],
  totalRequests = 1,
}: {
  violationRate: number;
  errorRate: number;
  contextHealth: number;
  findings?: Array<{
    ruleId: string;
    severity: string;
  }>;
  totalRequests?: number;
}): DriftAnalysis {
  const contributors: DriftContributor[] = [];

  // Severity weights (higher = more drift contribution)
  const severityWeight = {
    info: 0.1,
    medium: 0.4,
    high: 0.7,
    critical: 1.0,
  };

  // 1. Violation Rate Contribution (from rules)
  // Weight by severity of findings
  const severeCriticalFindings = findings.filter(
    f => f.severity === 'high' || f.severity === 'critical'
  );
  const severeCriticalRate = severeCriticalFindings.length / Math.max(1, totalRequests);

  // Noise suppression: single violation < 2% of window is de-weighted
  const violationThreshold = Math.max(2, Math.ceil(totalRequests * 0.02));
  const noiseAdjustment =
    severeCriticalFindings.length < violationThreshold
      ? severeCriticalFindings.length / violationThreshold
      : 1.0;

  const violationContribution = 0.5 * severeCriticalRate * noiseAdjustment;

  if (severeCriticalRate > 0.05) {
    contributors.push({
      category: 'rule-violations',
      severity: severeCriticalRate > 0.2 ? 'critical' : 'high',
      weight: violationContribution,
      explanation: `${severeCriticalFindings.length} high/critical findings (${(
        severeCriticalRate * 100
      ).toFixed(1)}% of requests)`,
      count: severeCriticalFindings.length,
    });
  }

  // 2. Error Rate Contribution
  const errorContribution = 0.3 * errorRate;

  if (errorRate > 0.05) {
    contributors.push({
      category: 'error-rate',
      severity: errorRate > 0.15 ? 'critical' : errorRate > 0.1 ? 'high' : 'medium',
      weight: errorContribution,
      explanation: `${(errorRate * 100).toFixed(1)}% of requests failed`,
      count: Math.round(totalRequests * errorRate),
    });
  }

  // 3. Context Health Contribution
  const contextDecay = 1 - contextHealth;
  const contextContribution = 0.2 * contextDecay;

  if (contextHealth < 0.7) {
    contributors.push({
      category: 'context-health',
      severity: contextHealth < 0.5 ? 'high' : 'medium',
      weight: contextContribution,
      explanation: `Context health degraded to ${(contextHealth * 100).toFixed(0)}%`,
      count: Math.round(totalRequests * (1 - contextHealth)),
    });
  }

  // 4. Info/Medium severity findings (lower signal, lower weight)
  const mediumFindings = findings.filter(f => f.severity === 'medium' || f.severity === 'info');
  const mediumContribution = Math.min(0.1, mediumFindings.length / (totalRequests * 10));

  if (mediumContribution > 0.02) {
    contributors.push({
      category: 'quality-warnings',
      severity: 'low',
      weight: mediumContribution,
      explanation: `${mediumFindings.length} informational findings (low priority)`,
      count: mediumFindings.length,
    });
  }

  // Total drift index
  const driftIndex = clamp(
    violationContribution + errorContribution + contextContribution + mediumContribution
  );

  return {
    driftIndex,
    contributors: contributors.sort((a, b) => b.weight - a.weight),
  };
}
