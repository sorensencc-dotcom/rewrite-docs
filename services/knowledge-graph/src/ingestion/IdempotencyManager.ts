import Database from "better-sqlite3";
import { GraphStore } from "../core/graph_store/GraphStore";

export interface EventCursor {
  id?: number;
  source: string;
  lastEventId: string;
  lastEventTimestamp: number;
  metaJson: Record<string, unknown>;
}

export class IdempotencyManager {
  private db: Database.Database;

  constructor(store: GraphStore) {
    // Use the same database handle as GraphStore for shared tables
    this.db = store.getDatabase();
    this.initializeSchema();
  }

  private initializeSchema(): void {
    const schema = `
      CREATE TABLE IF NOT EXISTS kg_event_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        processed_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS kg_cursor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL UNIQUE,
        last_event_id TEXT NOT NULL,
        last_event_timestamp INTEGER NOT NULL,
        meta_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `;

    this.db.exec(schema);

    // Create indexes
    const indexSchema = `
      CREATE INDEX IF NOT EXISTS idx_event_cache_id ON kg_event_cache(event_id);
      CREATE INDEX IF NOT EXISTS idx_event_cache_timestamp ON kg_event_cache(timestamp);
      CREATE INDEX IF NOT EXISTS idx_cursor_source ON kg_cursor(source);
    `;

    this.db.exec(indexSchema);
  }

  async isDuplicate(eventId: string, source: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 FROM kg_event_cache WHERE event_id = ? AND source = ?`)
      .get(eventId, source) as any;

    return row !== undefined;
  }

  async updateCursor(
    source: string,
    eventId: string,
    timestamp: number
  ): Promise<void> {
    // Insert into event cache
    const insertStmt = this.db.prepare(`
      INSERT INTO kg_event_cache (event_id, source, timestamp, processed_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(event_id) DO NOTHING
    `);

    insertStmt.run(eventId, source, timestamp, Date.now());

    // Update cursor
    const now = Date.now();
    const cursorStmt = this.db.prepare(`
      INSERT INTO kg_cursor (source, last_event_id, last_event_timestamp, meta_json, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(source) DO UPDATE SET
        last_event_id = excluded.last_event_id,
        last_event_timestamp = excluded.last_event_timestamp,
        updated_at = excluded.updated_at
    `);

    cursorStmt.run(source, eventId, timestamp, JSON.stringify({}), now);
  }

  async getCursor(source: string): Promise<EventCursor | null> {
    const row = this.db
      .prepare(`SELECT * FROM kg_cursor WHERE source = ?`)
      .get(source) as any;

    if (!row) return null;

    return {
      id: row.id,
      source: row.source,
      lastEventId: row.last_event_id,
      lastEventTimestamp: row.last_event_timestamp,
      metaJson: JSON.parse(row.meta_json),
    };
  }

  async getCursorStatus(
    source: string
  ): Promise<{ lastEventId: string; lastEventTimestamp: number; lag: number } | null> {
    const cursor = await this.getCursor(source);
    if (!cursor) return null;

    return {
      lastEventId: cursor.lastEventId,
      lastEventTimestamp: cursor.lastEventTimestamp,
      lag: Date.now() - cursor.lastEventTimestamp,
    };
  }

  async clearDuplicates(source: string, beforeTimestamp: number): Promise<number> {
    const result = this.db
      .prepare(
        `DELETE FROM kg_event_cache WHERE source = ? AND timestamp < ? RETURNING event_id`
      )
      .all(source, beforeTimestamp) as any[];

    return result.length;
  }

  close(): void {
    this.db.close();
  }
}
