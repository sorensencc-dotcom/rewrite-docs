import { AgenticMetrics, AgenticMetricsData } from './types';
import { RuleContext, RuleFinding } from './rules/types';
import { computeDriftIndex } from './metrics/drift';
import { clamp, normalize } from './utils';

export interface AgenticMetricsClient {
  getAgenticMetrics(
    userId: string,
    workspace: string,
    window?: { start?: string; end?: string }
  ): Promise<AgenticMetrics | null>;
}

export function createAgenticMetricsClient(): AgenticMetricsClient {
  return {
    async getAgenticMetrics(userId, workspace, window) {
      // Mocked metrics for v1, CIC will eventually pull this from TorqueQuery MCP
      return {
        userId,
        workspace,
        windowStart: window?.start ?? '',
        windowEnd: window?.end ?? '',
        promptDiscipline: 0.78,
        contextHealth: 0.86,
        reviewRigor: 0.91,
        skillReuse: 0.73,
        driftIndex: 0.18,
        readinessIndex: 0.84,
      };
    },
  };
}

export function computeMetrics(ctx: RuleContext, findings: RuleFinding[]): AgenticMetricsData {
  const requests = ctx.requests;
  const contexts = ctx.contexts;
  const reviews = ctx.reviews;

  // --- 1. Prompt Discipline ---
  // Measures quality of outputs: review coverage + error-free execution
  // Token thresholds:
  //   1500 = "large" output, should be reviewed (typical context: ~2-3 paragraphs)
  //   8000 = "critical" output, must be reviewed (typical context: ~10-15 paragraphs, near max window)
  const largeOutputs = requests.filter(r => r.tokensOut > 1500).length;
  const criticalOutputs = requests.filter(r => r.tokensOut > 8000).length;
  const unreviewedLarge = findings.filter(f => f.ruleId === 'large-output-without-review').length;
  const unreviewedCritical = findings.filter(f => f.ruleId === 'critical-output-unreviewed').length;
  const errorCount = requests.filter(r => r.status !== 'ok').length;
  const errorRate = errorCount / Math.max(1, requests.length);

  // Large outputs need review: 0.4 of score
  // Critical outputs MUST be reviewed: 0.3 of score
  // Errors: 0.3 of score
  const largeReviewPenalty =
    largeOutputs > 0 ? (unreviewedLarge / largeOutputs) * 0.4 : 0;
  const criticalReviewPenalty =
    criticalOutputs > 0 ? (unreviewedCritical / criticalOutputs) * 0.3 : 0;
  const errorPenalty = errorRate * 0.3;

  const promptDiscipline = clamp(1 - largeReviewPenalty - criticalReviewPenalty - errorPenalty);

  // --- 2. Context Health ---
  // Measures how well contexts are loaded and maintained
  // Freshness (how recent) is weighted higher than coverage (breadth)
  const avgCoverage =
    contexts.reduce((sum, c) => sum + c.coverageScore, 0) /
    Math.max(1, contexts.length);

  const avgFreshness =
    contexts.reduce((sum, c) => sum + c.freshnessScore, 0) /
    Math.max(1, contexts.length);

  // Freshness is 60% of health (recency matters more), coverage is 40%
  const contextHealth = clamp(avgFreshness * 0.6 + avgCoverage * 0.4);

  // --- 3. Review Rigor ---
  // Measures depth and frequency of code reviews
  const reviewRate = reviews.length / Math.max(1, requests.length);

  const avgDiff =
    reviews.reduce((sum, r) => sum + r.diffSizeLines, 0) /
    Math.max(1, reviews.length);

  const avgComments =
    reviews.reduce((sum, r) => sum + r.commentsCount, 0) /
    Math.max(1, reviews.length);

  // Review rate (50%) + diff depth (25%) + comment density (25%)
  const reviewRigor = clamp(
    0.5 * reviewRate +
      0.25 * normalize(avgDiff, 0, 200) +
      0.25 * normalize(avgComments, 0, 20)
  );

  // --- 4. Skill Reuse ---
  // Measures how much prompts are reused across requests
  const hashCounts = new Map<string, number>();
  for (const r of requests) {
    hashCounts.set(r.promptHash, (hashCounts.get(r.promptHash) || 0) + 1);
  }

  // Calculate reuse: sum of (count-1) for each unique hash, divided by total requests
  // This gives higher scores when fewer unique prompts handle more requests
  let totalReuse = 0;
  for (const count of hashCounts.values()) {
    totalReuse += Math.max(0, count - 1); // Only count repetitions beyond first use
  }

  const skillReuse = clamp(totalReuse / Math.max(1, requests.length));

  // --- 5. Drift Index ---
  // Measures workflow decay and rule violations
  // Computed by drift.ts with contributor tracking
  const driftAnalysis = computeDriftIndex({
    violationRate: 0, // drift.ts computes this from findings
    errorRate,
    contextHealth,
    findings,
    totalRequests: requests.length,
  });
  const driftIndex = driftAnalysis.driftIndex;

  // --- 6. Readiness Index ---
  // Composite signal: how ready is the workflow for production?
  // Higher = more ready, lower = needs attention
  // Weights: discipline (35%) + context (30%) + review (25%) + reuse (10%) - drift penalty
  const readinessIndex = clamp(
    0.35 * promptDiscipline +
      0.3 * contextHealth +
      0.25 * reviewRigor +
      0.1 * skillReuse -
      0.3 * driftIndex // Drift reduces readiness but doesn't eliminate it
  );

  return {
    promptDiscipline,
    contextHealth,
    reviewRigor,
    skillReuse,
    driftIndex,
    readinessIndex,
  };
}

