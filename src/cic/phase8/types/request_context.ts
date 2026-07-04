/**
 * Phase 8: Request Context
 * Defines request structure passed through cost optimization pipeline.
 */

export interface RequestContext {
  requestId: string;
  timestamp: string; // ISO8601
  agentId: string;
  serviceId: string;
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  maxOutputTokens?: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  slaMs?: number;
  metadata?: Record<string, unknown>;
}

export interface ValidatedRequestContext extends RequestContext {
  validated: true;
  validatedAt: string; // ISO8601
}

export function validateRequestContext(ctx: unknown): ctx is ValidatedRequestContext {
  if (!ctx || typeof ctx !== 'object') return false;

  const c = ctx as Record<string, unknown>;
  return (
    typeof c.requestId === 'string' &&
    typeof c.timestamp === 'string' &&
    typeof c.agentId === 'string' &&
    typeof c.serviceId === 'string' &&
    typeof c.model === 'string' &&
    typeof c.estimatedInputTokens === 'number' &&
    typeof c.estimatedOutputTokens === 'number' &&
    ['critical', 'high', 'normal', 'low'].includes(c.priority as string) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(c.timestamp as string)
  );
}
