import { searchHybrid, HybridSearchOptions } from './retrieval';
import { agenticEventSink } from './agentic';
import * as crypto from 'crypto';

export interface ContextTaskOptions {
  namespace: string;
  task: string;
  sessionRequestId?: string;
  embedding?: number[];
  max_context_tokens?: number;
  preferred_types?: string[];
}

const DEFAULT_TYPE_PREFERENCE: Record<string, number> = {
  'SYSTEM': 4,
  'LIVING': 3,
  'STATE': 2,
  'SCRATCH': 1
};

export async function getContextForTask(options: ContextTaskOptions) {
  const { namespace, task, sessionRequestId, embedding, max_context_tokens = 4000, preferred_types } = options;

  // Build the active type preference map
  const activeTypePreference: Record<string, number> = {};
  if (preferred_types && preferred_types.length > 0) {
    preferred_types.forEach((type, index) => {
      // Highest priority gets the largest number
      activeTypePreference[type] = preferred_types.length - index;
    });
  } else {
    Object.assign(activeTypePreference, DEFAULT_TYPE_PREFERENCE);
  }

  // 1. Run hybrid search
  const searchResult = await searchHybrid({
    namespace,
    query: task,
    embedding,
    max_results: 50 // Pull extra to allow for greedy packing
  });

  // 2. Sort by fused score and type preference
  searchResult.sort((a, b) => {
    // Primary: Type Preference (as required: SYSTEM > LIVING > STATE > SCRATCH, or custom)
    const typeDiff = (activeTypePreference[b.type] || 0) - (activeTypePreference[a.type] || 0);
    if (typeDiff !== 0) return typeDiff;
    
    // Secondary: Fused Score
    return b.fused_score - a.fused_score;
  });

  // 3. Greedily pack chunks
  const packedChunks = [];
  let currentTokens = 0;

  for (const chunk of searchResult) {
    // Approximate token count: chars / 4
    const contentToPack = `Title: ${chunk.title}\n${chunk.body}`;
    const estimatedTokens = Math.ceil(contentToPack.length / 4);

    if (currentTokens + estimatedTokens <= max_context_tokens) {
      packedChunks.push(chunk);
      currentTokens += estimatedTokens;
    } else {
      // If one chunk is too big, skip and try next smaller chunk
      continue;
    }
  }

  // Emit context slice telemetry
  const ctxSlice = {
    id: `ctx-${crypto.randomUUID()}`,
    sessionRequestId: sessionRequestId || `req-${crypto.randomUUID()}`,
    source: 'files' as const,
    sizeBytes: currentTokens * 4,
    coverageScore: 0.85,
    freshnessScore: 0.90
  };
  await agenticEventSink.emitContextSlice(ctxSlice);

  return {
    chunks: packedChunks,
    token_count: currentTokens
  };
}
