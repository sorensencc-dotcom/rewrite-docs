/**
 * Phase 8: Cost Model
 * Maintains rolling windows of cost data (5m, 1h, 24h).
 */

import { CostEvent } from '../types/cost_event.js';

export interface CostWindow {
  windowName: string;
  windowMs: number;
  totalCostUsd: number;
  eventCount: number;
  startTime: string; // ISO8601
  endTime: string; // ISO8601
}

export class CostModel {
  private events: CostEvent[] = [];
  private readonly windows = {
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  };

  constructor(private maxEventsInMemory = 10000) {}

  recordEvent(event: CostEvent): void {
    this.events.push(event);

    // Keep in-memory buffer bounded
    if (this.events.length > this.maxEventsInMemory) {
      this.events = this.events.slice(-this.maxEventsInMemory);
    }
  }

  private getWindowEvents(windowMs: number): CostEvent[] {
    const now = Date.now();
    const cutoff = now - windowMs;

    return this.events.filter(e => {
      const eventTime = new Date(e.timestamp).getTime();
      return eventTime >= cutoff;
    });
  }

  getDailySpendUsd(): number {
    return this.getWindowEvents(this.windows['24h']).reduce((sum, e) => sum + e.costUsd, 0);
  }

  getHourlySpendUsd(): number {
    return this.getWindowEvents(this.windows['1h']).reduce((sum, e) => sum + e.costUsd, 0);
  }

  getFiveMinuteSpendUsd(): number {
    return this.getWindowEvents(this.windows['5m']).reduce((sum, e) => sum + e.costUsd, 0);
  }

  getSpendByAgent(windowMs?: number): Record<string, number> {
    const window = windowMs || this.windows['24h'];
    const events = this.getWindowEvents(window);
    const byAgent: Record<string, number> = {};

    events.forEach(e => {
      byAgent[e.agentId] = (byAgent[e.agentId] || 0) + e.costUsd;
    });

    return byAgent;
  }

  getSpendByModel(windowMs?: number): Record<string, number> {
    const window = windowMs || this.windows['24h'];
    const events = this.getWindowEvents(window);
    const byModel: Record<string, number> = {};

    events.forEach(e => {
      byModel[e.model] = (byModel[e.model] || 0) + e.costUsd;
    });

    return byModel;
  }

  getSpendWindow(name: '5m' | '1h' | '24h'): CostWindow {
    const windowMs = this.windows[name];
    const events = this.getWindowEvents(windowMs);
    const now = new Date();
    const startTime = new Date(now.getTime() - windowMs);

    return {
      windowName: name,
      windowMs,
      totalCostUsd: events.reduce((sum, e) => sum + e.costUsd, 0),
      eventCount: events.length,
      startTime: startTime.toISOString(),
      endTime: now.toISOString()
    };
  }

  clear(): void {
    this.events = [];
  }
}
