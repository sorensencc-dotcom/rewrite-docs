import {
  Session,
  SessionRequest,
  ContextSlice,
  ReviewEvent,
} from './types';

// In-memory store for v1
export const inMemoryEvents = {
  sessions: [] as Session[],
  requests: [] as SessionRequest[],
  contextSlices: [] as ContextSlice[],
  reviewEvents: [] as ReviewEvent[],
};

export interface AgenticEventSink {
  emitSession(session: Session): Promise<void>;
  emitSessionRequest(req: SessionRequest): Promise<void>;
  emitContextSlice(ctx: ContextSlice): Promise<void>;
  emitReviewEvent(ev: ReviewEvent): Promise<void>;
}

export function createAgenticEventSink(): AgenticEventSink {
  return {
    async emitSession(session) {
      inMemoryEvents.sessions.push(session);
    },
    async emitSessionRequest(req) {
      inMemoryEvents.requests.push(req);
    },
    async emitContextSlice(ctx) {
      inMemoryEvents.contextSlices.push(ctx);
    },
    async emitReviewEvent(ev) {
      inMemoryEvents.reviewEvents.push(ev);
    },
  };
}
