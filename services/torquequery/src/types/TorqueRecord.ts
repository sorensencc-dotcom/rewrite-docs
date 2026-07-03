// TorqueQuery Record Types (Phase 26)

export interface TorqueMemoryEvent {
  id: string;
  type: string;
  agentId: string;
  timestamp: string;
  correlationId?: string;
  payload: unknown;
  createdAt: string;
  indexedAt?: string;
}

export interface TorqueSignal {
  id: string;
  eventId: string;
  signalType: string;
  value?: number;
  timestamp: string;
}

export interface TorqueCorrelation {
  id: string;
  correlationId: string;
  eventIds: string[];
  createdAt: string;
  resolvedAt?: string;
}

export interface TorqueAgent {
  id: string;
  agentId: string;
  lastSeen: string;
  eventCount: number;
}

export interface TorqueGovernanceHistory {
  id: string;
  proposalId: string;
  voteCount?: number;
  decision?: string;
  timestamp: string;
}

export interface TorqueAgentTimeline {
  id: string;
  agentId: string;
  eventId: string;
  sequence: number;
  timestamp: string;
}

export interface TorqueQueryResult {
  events: TorqueMemoryEvent[];
  signals: TorqueSignal[];
  correlations: TorqueCorrelation[];
  agents: TorqueAgent[];
}

// Ingest request types
export interface TorqueIngestRequest {
  id?: string;
  type: string;
  agentId: string;
  timestamp?: string;
  correlationId?: string;
  payload: unknown;
  signals?: Array<{ type: string; value?: number; timestamp?: string }>;
}

export interface TorqueIngestBatchRequest {
  events: TorqueIngestRequest[];
}

export interface TorqueIngestResponse {
  id: string;
  status: 'indexed' | 'error';
  error?: string;
}

// Schema validation
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateEvent(req: unknown): TorqueIngestRequest {
  if (typeof req !== 'object' || req === null) {
    throw new ValidationError('Event must be an object');
  }

  const event = req as any;

  if (!event.type || typeof event.type !== 'string') {
    throw new ValidationError('Event.type is required and must be string');
  }

  if (!event.agentId || typeof event.agentId !== 'string') {
    throw new ValidationError('Event.agentId is required and must be string');
  }

  if (event.payload === undefined || event.payload === null) {
    throw new ValidationError('Event.payload is required');
  }

  if (event.timestamp && typeof event.timestamp !== 'string') {
    throw new ValidationError('Event.timestamp must be ISO string');
  }

  if (event.correlationId && typeof event.correlationId !== 'string') {
    throw new ValidationError('Event.correlationId must be string');
  }

  if (event.signals && !Array.isArray(event.signals)) {
    throw new ValidationError('Event.signals must be array');
  }

  return event as TorqueIngestRequest;
}
