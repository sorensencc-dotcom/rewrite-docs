// TorqueQuery Memory Indexer (Phase 26)
// Listens to MemoryStore events and indexes them in SQLite

import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { TorqueMemoryEvent, TorqueSignal, TorqueAgentTimeline } from '../types/TorqueRecord';

export class MemoryIndexer {
  constructor(private db: Database.Database) {}

  indexEvent(event: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO memory_events
      (id, type, agentId, timestamp, correlationId, payload, createdAt, indexedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.id || uuid(),
      event.type,
      event.agentId,
      event.timestamp,
      event.correlationId,
      JSON.stringify(event.payload || {}),
      event.createdAt || new Date().toISOString(),
      new Date().toISOString()
    );

    // Update agent record
    this.indexAgent(event.agentId, event.timestamp);

    // Index signals if present
    if (event.signals && Array.isArray(event.signals)) {
      for (const signal of event.signals) {
        this.indexSignal(event.id, signal);
      }
    }

    // Index correlation if present
    if (event.correlationId) {
      this.indexCorrelation(event.correlationId, event.id);
    }

    // Index timeline entry
    this.indexAgentTimeline(event.agentId, event.id, event.timestamp);
  }

  private indexAgent(agentId: string, timestamp: string): void {
    const existing = this.db
      .prepare(`SELECT * FROM agents WHERE agentId = ?`)
      .get(agentId);

    if (existing) {
      this.db.prepare(`
        UPDATE agents
        SET lastSeen = ?, eventCount = eventCount + 1
        WHERE agentId = ?
      `).run(timestamp, agentId);
    } else {
      this.db.prepare(`
        INSERT INTO agents (id, agentId, lastSeen, eventCount)
        VALUES (?, ?, ?, 1)
      `).run(uuid(), agentId, timestamp);
    }
  }

  private indexSignal(eventId: string, signal: any): void {
    this.db.prepare(`
      INSERT INTO signals (id, eventId, signalType, value, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuid(),
      eventId,
      signal.type || signal.signalType,
      signal.value,
      signal.timestamp || new Date().toISOString()
    );
  }

  private indexCorrelation(correlationId: string, eventId: string): void {
    const existing = this.db
      .prepare(`SELECT eventIds FROM correlations WHERE correlationId = ?`)
      .get(correlationId) as { eventIds: string } | undefined;

    if (existing) {
      const eventIds = JSON.parse(existing.eventIds);
      eventIds.push(eventId);
      this.db.prepare(`
        UPDATE correlations SET eventIds = ? WHERE correlationId = ?
      `).run(JSON.stringify(eventIds), correlationId);
    } else {
      this.db.prepare(`
        INSERT INTO correlations (id, correlationId, eventIds, createdAt)
        VALUES (?, ?, ?, ?)
      `).run(
        uuid(),
        correlationId,
        JSON.stringify([eventId]),
        new Date().toISOString()
      );
    }
  }

  private indexAgentTimeline(agentId: string, eventId: string, timestamp: string): void {
    const maxSeq = this.db
      .prepare(`SELECT MAX(sequence) as seq FROM agent_timeline WHERE agentId = ?`)
      .get(agentId) as { seq: number | null };

    const sequence = (maxSeq.seq || 0) + 1;

    this.db.prepare(`
      INSERT INTO agent_timeline (id, agentId, eventId, sequence, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuid(),
      agentId,
      eventId,
      sequence,
      timestamp
    );
  }

  indexGovernanceHistory(proposalId: string, voteCount?: number, decision?: string): void {
    this.db.prepare(`
      INSERT INTO governance_history (id, proposalId, voteCount, decision, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuid(),
      proposalId,
      voteCount,
      decision,
      new Date().toISOString()
    );
  }
}
