import { agenticMetricsClient } from './agentic';

export type ChunkType = 'SYSTEM' | 'STATE' | 'LIVING' | 'SCRATCH';

export interface ChunkInput {
  namespace: string;
  type: ChunkType;
  title?: string;
  body?: string;
  tags?: string[];
  importance?: number;
  ttl_days?: number | null;
  provenance: {
    source: string;
    [key: string]: any;
  };
}

export function applyGovernance(chunk: ChunkInput): ChunkInput {
  // 1. Validate type
  const validTypes: ChunkType[] = ['SYSTEM', 'STATE', 'LIVING', 'SCRATCH'];
  if (!validTypes.includes(chunk.type)) {
    throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
  }

  // 2. Require namespace
  if (!chunk.namespace || typeof chunk.namespace !== 'string') {
    throw new Error('Namespace is required and must be a string.');
  }

  // 3. Require provenance.source
  if (!chunk.provenance || !chunk.provenance.source) {
    throw new Error('Provenance with a "source" field is required.');
  }

  // 4. Enforce TTL rules
  if (chunk.type === 'SYSTEM' || chunk.type === 'LIVING') {
    chunk.ttl_days = null;
  } else if (chunk.type === 'STATE' && chunk.ttl_days === undefined) {
    chunk.ttl_days = 30;
  } else if (chunk.type === 'SCRATCH' && chunk.ttl_days === undefined) {
    chunk.ttl_days = 7;
  }

  // 5. Clamp importance to [0.0, 1.0]
  if (chunk.importance !== undefined) {
    chunk.importance = Math.max(0.0, Math.min(1.0, chunk.importance));
  } else {
    chunk.importance = 0.5; // Default importance if not provided
  }

  // 6. Reject oversized chunks (e.g., body > 100KB)
  const MAX_BODY_LENGTH = 100000;
  if (chunk.body && chunk.body.length > MAX_BODY_LENGTH) {
    throw new Error('Chunk body is oversized (exceeds 100,000 characters).');
  }

  return chunk;
}

export interface GovernanceOptions {
  minReadiness?: number;
  maxDrift?: number;
}

export interface GovernanceDecision {
  requireClaudeReview: boolean;
  requireMaalAudit: boolean;
  reason?: string;
}

export function createGovernanceMiddleware(opts: GovernanceOptions = { minReadiness: 0.6, maxDrift: 0.4 }) {
  return async function evaluateGovernance(
    userId: string,
    workspace: string
  ): Promise<GovernanceDecision> {
    const metrics = await agenticMetricsClient.getAgenticMetrics(userId, workspace);
    if (!metrics) {
      return { requireClaudeReview: false, requireMaalAudit: false };
    }

    const requireClaudeReview =
      metrics.readinessIndex < (opts.minReadiness ?? 0.6) ||
      metrics.driftIndex > (opts.maxDrift ?? 0.4);

    const requireMaalAudit = metrics.reviewRigor < 0.7;

    return {
      requireClaudeReview,
      requireMaalAudit,
      reason: requireClaudeReview
        ? 'Agentic readiness low or drift high'
        : requireMaalAudit
        ? 'Review rigor below threshold'
        : undefined,
    };
  };
}
