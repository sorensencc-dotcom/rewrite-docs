// Phase 26 SDK draft -- not wired into any adapter yet.
//
// Typed client for torque-query-docs: the documentation RAG service in
// castironforge/torque-query-docs. It answers questions against ingested
// MkDocs content (embeddings + reranking + LLM synthesis over docs/*.md).
//
// Named per Tier 1 decision 2026-07-17 (Option i, split and rename). This is
// explicitly NOT the other "TorqueQuery" service (memory/drift search over
// CIC + MAAL data, which keeps that name -- client at
// cic-ingestion/src/services/torquequery/TorqueQueryClient.ts, default port
// 3110). Do not merge or alias these two clients -- see
// docs/meta/phases/torquequery-reconciliation-charter.md in the main C:/dev
// repo, and castironforge/torque-query-docs/HARDENING-NOTES.md.
//
// Response shapes here mirror the Pydantic response_model classes frozen in
// castironforge/torque-query-docs/src/main.py (QueryResponse / IngestResponse
// / IngestErrorResponse) as of the Phase 26 hardening pass.

export interface TorqueQueryDocsClientConfig {
  /** Base URL of the documentation RAG service, e.g. http://localhost:8000 */
  url?: string;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

export interface QuerySource {
  file: string;
  section: string;
  tags: string[];
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: QuerySource[];
  confidence: number;
  not_in_docs: boolean;
}

export interface QueryRequest {
  question: string;
  taskLabels?: string[];
}

export interface IngestResponse {
  status: string;
  docCount?: number;
  nodeCount?: number;
  durationMs?: number;
}

export interface IngestErrorResponse {
  status: string;
  errorCode: string;
  message: string;
}

export interface HealthResponse {
  status: 'healthy' | 'initializing';
  error: string | null;
  version: string;
  models: {
    llm: string;
    embedding: string;
    reranker: string;
  };
  config: {
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
    maxContextTokens: number;
  };
}

export class TorqueQueryDocsClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'TorqueQueryDocsClientError';
  }
}

/**
 * Minimal typed HTTP client for the documentation RAG service, named
 * "torque-query-docs" per Tier 1 decision 2026-07-17. Not wired into any CIC
 * adapter -- this is a standalone draft SDK produced during pre-decision
 * hardening, still awaiting adapter integration.
 */
export class TorqueQueryDocsClient {
  private readonly url: string;
  private readonly timeoutMs: number;

  constructor(config: TorqueQueryDocsClientConfig = {}) {
    this.url = config.url || process.env.TORQUE_QUERY_DOCS_URL || 'http://localhost:8000';
    this.timeoutMs = config.timeoutMs ?? 300_000; // LLM completion can be slow on CPU-only Ollama
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health');
  }

  async query(req: QueryRequest): Promise<QueryResponse> {
    return this.request<QueryResponse>('POST', '/query', req);
  }

  async ingest(): Promise<IngestResponse> {
    return this.request<IngestResponse>('POST', '/ingest', undefined, 900_000); // full-corpus reindex
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    timeoutOverrideMs?: number,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutOverrideMs ?? this.timeoutMs);

    try {
      const res = await fetch(`${this.url}${path}`, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await res.text();
      const parsed = text ? JSON.parse(text) : undefined;

      if (!res.ok) {
        const detail = parsed?.detail ?? parsed;
        throw new TorqueQueryDocsClientError(
          `TorqueQueryDocs request failed: ${method} ${path} -> ${res.status}`,
          res.status,
          detail,
        );
      }

      return parsed as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
