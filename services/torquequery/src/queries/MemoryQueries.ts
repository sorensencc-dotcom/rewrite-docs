// TorqueQuery Memory Query Operators (Phase 26)

import Database from 'better-sqlite3';
import { TorqueMemoryEvent, TorqueSignal, TorqueAgentTimeline } from '../types/TorqueRecord';

export class MemoryQueries {
  constructor(private db: Database.Database) {}

  byType(type: string): TorqueMemoryEvent[] {
    const stmt = this.db.prepare(`
      SELECT id, type, agentId, timestamp, correlationId, payload, createdAt, indexedAt
      FROM memory_events
      WHERE type = ?
      ORDER BY timestamp DESC
    `);
    const rows = stmt.all(type) as any[];
    return rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
    }));
  }

  byAgent(agentId: string): TorqueMemoryEvent[] {
    const stmt = this.db.prepare(`
      SELECT id, type, agentId, timestamp, correlationId, payload, createdAt, indexedAt
      FROM memory_events
      WHERE agentId = ?
      ORDER BY timestamp DESC
    `);
    const rows = stmt.all(agentId) as any[];
    return rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
    }));
  }

  byCorrelation(correlationId: string): TorqueMemoryEvent[] {
    const stmt = this.db.prepare(`
      SELECT id, type, agentId, timestamp, correlationId, payload, createdAt, indexedAt
      FROM memory_events
      WHERE correlationId = ?
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(correlationId) as any[];
    return rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
    }));
  }

  bySignal(signalType: string): TorqueSignal[] {
    const stmt = this.db.prepare(`
      SELECT id, eventId, signalType, value, timestamp
      FROM signals
      WHERE signalType = ?
      ORDER BY timestamp DESC
    `);
    return stmt.all(signalType) as TorqueSignal[];
  }

  agentTimeline(agentId: string): TorqueAgentTimeline[] {
    const stmt = this.db.prepare(`
      SELECT id, agentId, eventId, sequence, timestamp
      FROM agent_timeline
      WHERE agentId = ?
      ORDER BY sequence ASC
    `);
    return stmt.all(agentId) as TorqueAgentTimeline[];
  }

  governanceHistory(proposalId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT id, proposalId, voteCount, decision, timestamp
      FROM governance_history
      WHERE proposalId = ?
      ORDER BY timestamp DESC
    `);
    return stmt.all(proposalId);
  }

  latestByAgent(agentId: string, limit = 10): TorqueMemoryEvent[] {
    const stmt = this.db.prepare(`
      SELECT id, type, agentId, timestamp, correlationId, payload, createdAt, indexedAt
      FROM memory_events
      WHERE agentId = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    const rows = stmt.all(agentId, limit) as any[];
    return rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
    }));
  }

  countByType(type: string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM memory_events WHERE type = ?
    `);
    const result = stmt.get(type) as { count: number };
    return result.count;
  }

  countByAgent(agentId: string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM memory_events WHERE agentId = ?
    `);
    const result = stmt.get(agentId) as { count: number };
    return result.count;
  }
}
