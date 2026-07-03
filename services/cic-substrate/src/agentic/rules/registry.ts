import { AgenticRule, RuleContext, RuleFinding } from './types';

// Helper: check if a request has been reviewed
function isUnreviewed(ctx: RuleContext, requestId: string): boolean {
  return !ctx.reviews.some(rv => rv.sessionRequestId === requestId);
}

export const ruleRegistry: AgenticRule[] = [
  // Rule 1: Large Output Without Review (refined)
  {
    id: 'large-output-without-review',
    description: 'Large model outputs should be reviewed before use',
    evaluate(ctx) {
      return ctx.requests
        .filter(r => r.tokensOut > 1500 && r.tokensOut <= 8000)
        .filter(r => isUnreviewed(ctx, r.id))
        .map(r => ({
          id: `finding-${r.id}`,
          ruleId: 'large-output-without-review',
          severity: r.tokensOut > 3000 ? 'high' : 'medium',
          message: `Unreviewed output: ${r.tokensOut} tokens (threshold: 1500)`,
          advice: 'Large outputs should be reviewed for correctness and relevance before use.',
          sessionRequestId: r.id,
        }));
    },
  },

  // Rule 2: Critical Output Without Review (very large)
  {
    id: 'critical-output-unreviewed',
    description: 'Extremely large outputs (>8k tokens) must be reviewed',
    evaluate(ctx) {
      return ctx.requests
        .filter(r => r.tokensOut > 8000)
        .filter(r => isUnreviewed(ctx, r.id))
        .map(r => ({
          id: `finding-${r.id}`,
          ruleId: 'critical-output-unreviewed',
          severity: 'critical',
          message: `Critical unreviewed output: ${r.tokensOut} tokens`,
          advice: 'Outputs exceeding 8000 tokens require thorough review. This is critical for quality.',
          sessionRequestId: r.id,
        }));
    },
  },

  // Rule 3: Context Freshness Decay
  {
    id: 'context-freshness-decay',
    description: 'Context freshness should remain above 0.7',
    evaluate(ctx) {
      return ctx.contexts
        .filter(c => c.freshnessScore < 0.7)
        .map((c, idx) => ({
          id: `context-${idx}`,
          ruleId: 'context-freshness-decay',
          severity: c.freshnessScore < 0.5 ? 'high' : 'medium',
          message: `Context freshness low: ${(c.freshnessScore * 100).toFixed(0)}%`,
          advice: 'Reload context from recent requests to maintain freshness. Stale context reduces accuracy.',
          sessionId: c.sessionId,
        }));
    },
  },

  // Rule 4: High Request Error Rate
  {
    id: 'high-error-rate',
    description: 'Request error rate should remain below 10%',
    evaluate(ctx) {
      const errorCount = ctx.requests.filter(r => r.status !== 'ok').length;
      const errorRate = errorCount / Math.max(1, ctx.requests.length);

      if (errorRate > 0.1) {
        return [
          {
            id: 'error-rate-critical',
            ruleId: 'high-error-rate',
            severity: errorRate > 0.25 ? 'critical' : 'high',
            message: `Error rate: ${(errorRate * 100).toFixed(1)}% (${errorCount}/${ctx.requests.length} requests failed)`,
            advice: 'High error rates indicate workflow instability. Review error logs and adjust request patterns.',
          },
        ];
      }
      return [];
    },
  },

  // Rule 5: Low Review Coverage
  {
    id: 'low-review-coverage',
    description: 'Code/prompt review should cover >50% of requests',
    evaluate(ctx) {
      const reviewRate = ctx.reviews.length / Math.max(1, ctx.requests.length);

      if (reviewRate < 0.5) {
        return [
          {
            id: 'review-coverage-low',
            ruleId: 'low-review-coverage',
            severity: reviewRate < 0.2 ? 'high' : 'medium',
            message: `Review coverage: ${(reviewRate * 100).toFixed(0)}% (${ctx.reviews.length}/${ctx.requests.length} reviewed)`,
            advice: 'Increase code review frequency. Regular review improves quality and catches errors early.',
          },
        ];
      }
      return [];
    },
  },

  // Rule 6: Skill Fragmentation (Low Reuse)
  {
    id: 'skill-fragmentation',
    description: 'Prompt uniqueness should not exceed 60% (reuse < 40%)',
    evaluate(ctx) {
      const hashCounts = new Map<string, number>();
      for (const r of ctx.requests) {
        hashCounts.set(r.promptHash, (hashCounts.get(r.promptHash) || 0) + 1);
      }

      const uniqueCount = hashCounts.size;
      const uniqueRatio = uniqueCount / Math.max(1, ctx.requests.length);

      if (uniqueRatio > 0.6) {
        return [
          {
            id: 'fragmentation-high',
            ruleId: 'skill-fragmentation',
            severity: uniqueRatio > 0.8 ? 'medium' : 'info',
            message: `High prompt uniqueness: ${(uniqueRatio * 100).toFixed(0)}% (${uniqueCount} unique of ${ctx.requests.length})`,
            advice: 'Consider reusing proven prompts. High uniqueness indicates low skill adoption and efficiency loss.',
          },
        ];
      }
      return [];
    },
  },

  // Rule 7: Inefficient Context Usage
  {
    id: 'inefficient-context-usage',
    description: 'Context should have >60% coverage (using the data loaded)',
    evaluate(ctx) {
      return ctx.contexts
        .filter(c => c.coverageScore < 0.6)
        .map((c, idx) => ({
          id: `coverage-${idx}`,
          ruleId: 'inefficient-context-usage',
          severity: c.coverageScore < 0.3 ? 'medium' : 'info',
          message: `Low context coverage: ${(c.coverageScore * 100).toFixed(0)}%`,
          advice: 'Refine context loading to include only relevant data. Low coverage wastes token budget.',
          sessionId: c.sessionId,
        }));
    },
  },

  // Rule 8: Response Latency Issues
  {
    id: 'high-latency-requests',
    description: 'Request latency should remain <5s for real-time workflows',
    evaluate(ctx) {
      const slowRequests = ctx.requests.filter(r => r.latencyMs > 5000);

      if (slowRequests.length > ctx.requests.length * 0.1) {
        const avgLatency = (
          slowRequests.reduce((sum, r) => sum + r.latencyMs, 0) /
          Math.max(1, slowRequests.length)
        ).toFixed(0);

        return [
          {
            id: 'latency-high',
            ruleId: 'high-latency-requests',
            severity: slowRequests.length > ctx.requests.length * 0.25 ? 'high' : 'medium',
            message: `${slowRequests.length} requests exceeded 5s latency (avg: ${avgLatency}ms)`,
            advice: 'High latency can indicate network issues, token overload, or model contention. Monitor and optimize.',
          },
        ];
      }
      return [];
    },
  },
];
