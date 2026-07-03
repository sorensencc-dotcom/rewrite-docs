import { RuleContext } from '../rules/types';
import { clamp } from '../utils';

export interface DetectedSkill {
  promptHash: string;
  frequency: number;
  stabilityScore: number;
  confidence: number;
  sessionClusters: number;
  avgContextCoverage: number;
  avgContextFreshness: number;
  avgTokensIn: number;
  avgTokensOut: number;
  successRate: number;
  recommendation: 'adopt' | 'monitor' | 'refine';
}

export function extractSkills(ctx: RuleContext): DetectedSkill[] {
  const hashData = new Map<
    string,
    {
      requests: typeof ctx.requests;
      coverage: number[];
      freshness: number[];
      successCount: number;
    }
  >();

  // Group requests by promptHash
  for (const req of ctx.requests) {
    if (!hashData.has(req.promptHash)) {
      hashData.set(req.promptHash, {
        requests: [],
        coverage: [],
        freshness: [],
        successCount: 0,
      });
    }

    const data = hashData.get(req.promptHash)!;
    data.requests.push(req);
    if (req.status === 'ok') data.successCount++;
  }

  // Enrich with context data
  for (const [hash, data] of hashData.entries()) {
    for (const req of data.requests) {
      const matchingContexts = ctx.contexts.filter(c => c.sessionId === req.sessionId);
      for (const context of matchingContexts) {
        data.coverage.push(context.coverageScore);
        data.freshness.push(context.freshnessScore);
      }
    }
  }

  // Build skill detections
  const skills: DetectedSkill[] = [];

  for (const [hash, data] of hashData.entries()) {
    const frequency = data.requests.length;

    // Only consider skills with 3+ occurrences (minimum viability)
    if (frequency < 3) continue;

    // Stability: how consistent are contexts and success?
    const avgCoverage =
      data.coverage.length > 0
        ? data.coverage.reduce((a, b) => a + b, 0) / data.coverage.length
        : 0.5;

    const avgFreshness =
      data.freshness.length > 0
        ? data.freshness.reduce((a, b) => a + b, 0) / data.freshness.length
        : 0.5;

    // Variance in coverage/freshness indicates instability
    const coverageVariance = computeVariance(data.coverage);
    const freshnessVariance = computeVariance(data.freshness);
    const maxVariance = Math.max(coverageVariance, freshnessVariance);
    // Stability score: assumes variance (std dev) ≤ 1.0 for normalized [0,1] scores.
    // Higher variance = less stable (more deviation from mean score).
    const stabilityScore = clamp(1 - maxVariance);

    // Success rate
    const successRate = data.successCount / frequency;

    // Session clustering: how many distinct sessions use this skill?
    const uniqueSessions = new Set(data.requests.map(r => r.sessionId)).size;
    const sessionClusteringScore = Math.min(1, uniqueSessions / Math.max(1, frequency / 2));

    // Confidence: combines stability, success rate, and clustering
    // High confidence if stable, successful, and used across sessions
    const confidence = clamp(
      0.4 * stabilityScore +
        0.4 * successRate +
        0.2 * sessionClusteringScore
    );

    // Recommendation logic
    let recommendation: 'adopt' | 'monitor' | 'refine' = 'monitor';

    if (confidence > 0.8 && successRate > 0.95 && frequency >= 5) {
      recommendation = 'adopt'; // High confidence, proven
    } else if (confidence > 0.6 && successRate > 0.85 && frequency >= 3) {
      recommendation = 'monitor'; // Good but needs validation
    } else if (confidence < 0.5 || successRate < 0.7) {
      recommendation = 'refine'; // Needs improvement
    }

    // Token usage stats
    const avgTokensIn =
      data.requests.reduce((sum, r) => sum + r.tokensIn, 0) / frequency;
    const avgTokensOut =
      data.requests.reduce((sum, r) => sum + r.tokensOut, 0) / frequency;

    skills.push({
      promptHash: hash,
      frequency,
      stabilityScore,
      confidence,
      sessionClusters: uniqueSessions,
      avgContextCoverage: avgCoverage,
      avgContextFreshness: avgFreshness,
      avgTokensIn,
      avgTokensOut,
      successRate,
      recommendation,
    });
  }

  // Sort by confidence descending
  return skills.sort((a, b) => b.confidence - a.confidence);
}

// Helpers
function computeVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff); // Standard deviation
}
