/**
 * MemoryQueryClient — HTTP client for Phase 23.2 Memory Query API
 * Fetches signals and metrics for governance context
 */

import axios, { AxiosInstance } from 'axios';

export interface MemoryEvent {
  id: string;
  event_type: string;
  source_agent: string;
  session_id: string;
  correlation_id: string;
  timestamp: string;
  payload: unknown;
  checksum?: string;
  retention_days: number;
  version: number;
}

export interface QueryResult {
  events: MemoryEvent[];
  total: number;
  limit: number;
  offset: number;
  queried_at: string;
}

export class MemoryQueryClient {
  private http: AxiosInstance;

  constructor(baseUrl: string = 'http://localhost:3100') {
    this.http = axios.create({ baseURL: baseUrl });
  }

  /**
   * Get events by correlation ID (links to proposal)
   */
  async getEventsByProposal(proposalId: string): Promise<MemoryEvent[]> {
    const res = await this.http.get('/memory/events', {
      params: { correlationId: proposalId },
    });
    return ((res.data as QueryResult).events || []) as MemoryEvent[];
  }

  /**
   * Get governance signal events
   */
  async getGovernanceSignals(): Promise<MemoryEvent[]> {
    const res = await this.http.get('/memory/events', {
      params: { eventType: 'GOVERNANCE_SIGNAL', limit: '1000' },
    });
    return ((res.data as QueryResult).events || []) as MemoryEvent[];
  }

  /**
   * Get recent events (last N days)
   */
  async getRecentEvents(days: number = 7): Promise<MemoryEvent[]> {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const res = await this.http.get('/memory/events', {
      params: {
        startDate,
        endDate,
        limit: '10000',
      },
    });
    return ((res.data as QueryResult).events || []) as MemoryEvent[];
  }

  /**
   * Get metric summaries (drift/health)
   */
  async getSummaries(metric: 'drift' | 'health' = 'drift'): Promise<unknown> {
    const res = await this.http.get('/memory/summaries', {
      params: { metric, window: 'hourly' },
    });
    return res.data;
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<unknown> {
    const res = await this.http.get('/memory/stats');
    return res.data;
  }
}
