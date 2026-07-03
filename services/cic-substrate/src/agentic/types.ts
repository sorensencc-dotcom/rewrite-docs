export type Harness = 'vscode' | 'cli' | 'cic' | 'copilot_app' | 'other';

export interface Session {
  id: string;
  userId: string;
  harness: Harness;
  workspace: string;
  startTime: string;
  endTime?: string;
  tags?: string[];
}

export interface SessionRequest {
  id: string;
  sessionId: string;
  timestamp: string;
  model: string;          // e.g. 'gemini-2.0-pro', 'claude-3.7'
  surface: string;        // 'chat' | 'completion' | 'tool'
  promptHash: string;
  promptSummary: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  status: 'ok' | 'error';
}

export type ContextSource = 'files' | 'instructions' | 'tools' | 'policies';

export interface ContextSlice {
  id: string;
  sessionRequestId: string;
  source: ContextSource;
  sizeBytes: number;
  coverageScore: number;   // 0–1
  freshnessScore: number;  // 0–1
}

export type Reviewer = 'cic' | 'maal' | 'human' | 'claude';

export type ReviewResult = 'accepted' | 'edited' | 'rejected';

export interface ReviewEvent {
  id: string;
  sessionRequestId: string;
  reviewer: Reviewer;
  result: ReviewResult;
  diffSizeLines: number;
  commentsCount: number;
}

export interface AgenticMetricsData {
  promptDiscipline: number;
  contextHealth: number;
  reviewRigor: number;
  skillReuse: number;
  driftIndex: number;
  readinessIndex: number;
}

export interface AgenticMetrics extends AgenticMetricsData {
  userId: string;
  workspace: string;
  windowStart: string;
  windowEnd: string;
}
