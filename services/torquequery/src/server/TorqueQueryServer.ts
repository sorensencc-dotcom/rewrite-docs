// TorqueQuery Server (Phase 26)
// Manages SQLite database lifecycle

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { MemoryIndexer } from '../indexer/MemoryIndexer';
import { MemoryQueries } from '../queries/MemoryQueries';

export class TorqueQueryServer {
  private db!: Database.Database;
  private indexer!: MemoryIndexer;
  private queries!: MemoryQueries;
  private dbPath: string;

  constructor(dbPath = 'services/torquequery/db/torque.db') {
    this.dbPath = dbPath;
  }

  async init(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open database
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Load schema
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);

    // Initialize indexer and queries
    this.indexer = new MemoryIndexer(this.db);
    this.queries = new MemoryQueries(this.db);

    console.log(`TorqueQuery initialized: ${this.dbPath}`);
  }

  getIndexer(): MemoryIndexer {
    return this.indexer;
  }

  getQueries(): MemoryQueries {
    return this.queries;
  }

  getDb(): Database.Database {
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      console.log('TorqueQuery closed');
    }
  }

  isHealthy(): boolean {
    try {
      const result = this.db.prepare('SELECT 1').get();
      return !!result;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let instance: TorqueQueryServer | null = null;

export async function getTorqueQueryServer(dbPath?: string): Promise<TorqueQueryServer> {
  if (!instance) {
    instance = new TorqueQueryServer(dbPath);
    await instance.init();
  }
  return instance;
}

export function getTorqueQueryServerSync(): TorqueQueryServer {
  if (!instance) {
    throw new Error('TorqueQuery not initialized. Call getTorqueQueryServer first.');
  }
  return instance;
}
