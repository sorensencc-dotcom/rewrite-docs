// Phase 26 TypeScript stubs - TS2339 fixes
// Generated for autonomy API server + memory/retention

// MAAL stubs
export interface MaalJob {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaalConfig {
  retries: number;
  timeoutMs: number;
  enabled: boolean;
}

export interface MaalResult {
  success: boolean;
  payload: object;
  durationMs: number;
}

// Vector stubs
export interface VectorEmbedding {
  id: string;
  vector: number[];
  version: string;
}

export interface VectorConfig {
  dims: number;
  model: string;
  normalize: boolean;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: object;
}

// Learning stubs
export interface LearningTask {
  id: string;
  type: string;
  params: object;
}

export interface LearningMetrics {
  loss: number;
  accuracy: number;
  updatedAt: string;
}

export interface LearningConfig {
  batchSize: number;
  epochs: number;
  optimizer: string;
}

// Lib stubs
export interface HttpRequest {
  url: string;
  method: string;
  headers: object;
  body?: object;
}

export interface HttpResponse {
  status: number;
  data: object;
  headers: object;
}

export interface RetryPolicy {
  attempts: number;
  backoffMs: number;
}

// Wayland stubs
export interface WaylandNode {
  id: string;
  type: string;
  metadata: object;
}

export interface WaylandEdge {
  from: string;
  to: string;
  label: string;
}

export interface WaylandGraph {
  nodes: WaylandNode[];
  edges: WaylandEdge[];
}
