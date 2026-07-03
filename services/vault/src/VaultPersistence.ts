// Vault Persistence (M3)
// Handles deterministic vault records with SHA256 digest verification

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';

export interface VaultRecord {
  id: string;
  kind: string;
  payload: unknown;
  createdAt: string;
  vaultDigest: string;
}

export class VaultPersistence {
  private db!: Database.Database;

  async init(dbPath = 'services/vault/db/vault.db'): Promise<void> {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    const schemaPath = path.join(__dirname, './db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
  }

  private sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  async write(kind: string, payload: unknown): Promise<VaultRecord> {
    const id = uuid();
    const createdAt = new Date().toISOString();
    const base = { id, kind, payload, createdAt };
    const vaultDigest = this.sha256(JSON.stringify(base));

    const stmt = this.db.prepare(`
      INSERT INTO vault_records (id, kind, payload, createdAt, vaultDigest)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, kind, JSON.stringify(payload), createdAt, vaultDigest);

    return { ...base, vaultDigest };
  }

  async read(id: string): Promise<VaultRecord | null> {
    const stmt = this.db.prepare(`
      SELECT id, kind, payload, createdAt, vaultDigest
      FROM vault_records
      WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    const base = {
      id: row.id,
      kind: row.kind,
      payload: JSON.parse(row.payload),
      createdAt: row.createdAt,
    };

    const digest = this.sha256(JSON.stringify(base));
    if (digest !== row.vaultDigest) {
      this.logAudit('corruption_detected', { id });
      return null;
    }

    return { ...base, vaultDigest: row.vaultDigest };
  }

  async listByKind(kind: string): Promise<VaultRecord[]> {
    const stmt = this.db.prepare(`
      SELECT id, kind, payload, createdAt, vaultDigest
      FROM vault_records
      WHERE kind = ?
      ORDER BY createdAt DESC
    `);

    const rows = stmt.all(kind) as any[];
    return rows.map(row => ({
      id: row.id,
      kind: row.kind,
      payload: JSON.parse(row.payload),
      createdAt: row.createdAt,
      vaultDigest: row.vaultDigest,
    }));
  }

  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM vault_records WHERE id = ?');
    const result = stmt.run(id);
    return (result.changes || 0) > 0;
  }

  private logAudit(action: string, metadata: unknown = {}): void {
    const stmt = this.db.prepare(`
      INSERT INTO vault_audit_log (id, action, timestamp, metadata)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      uuid(),
      action,
      new Date().toISOString(),
      JSON.stringify(metadata)
    );
  }

  getAuditLog(limit = 100): any[] {
    const stmt = this.db.prepare(`
      SELECT id, action, timestamp, metadata
      FROM vault_audit_log
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}'),
    }));
  }

  close(): void {
    if (this.db) {
      this.db.close();
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
