// Vault Secrets (M3)
// AES-256-GCM encrypted secret storage

import Database from 'better-sqlite3';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';

export class VaultSecrets {
  private db!: Database.Database;
  private key: Buffer;

  constructor(secretKey?: string) {
    const key = secretKey || process.env.VAULT_SECRET_KEY;
    if (!key && process.env.NODE_ENV !== 'test') {
      throw new Error('VAULT_SECRET_KEY environment variable required');
    }
    this.key = crypto
      .createHash('sha256')
      .update(key || 'test-key-do-not-use-in-prod')
      .digest();
  }

  async init(dbPath = 'services/vault/db/vault.db'): Promise<void> {
    this.db = new Database(dbPath);
  }

  private encrypt(value: string): Buffer {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]);
  }

  private decrypt(buf: Buffer): string {
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  }

  async writeSecret(value: string): Promise<string> {
    const id = uuid();
    const createdAt = new Date().toISOString();
    const encryptedValue = this.encrypt(value);

    const stmt = this.db.prepare(`
      INSERT INTO vault_secrets (id, encryptedValue, createdAt)
      VALUES (?, ?, ?)
    `);

    stmt.run(id, encryptedValue, createdAt);
    return id;
  }

  async readSecret(id: string): Promise<string | null> {
    const stmt = this.db.prepare(`
      SELECT encryptedValue FROM vault_secrets WHERE id = ?
    `);

    const row = stmt.get(id) as { encryptedValue: Buffer } | undefined;
    if (!row) return null;

    try {
      return this.decrypt(row.encryptedValue);
    } catch (error) {
      console.error('Failed to decrypt secret:', error);
      return null;
    }
  }

  async rotateSecret(id: string, newValue: string): Promise<boolean> {
    const existing = await this.readSecret(id);
    if (!existing) return false;

    const newEncrypted = this.encrypt(newValue);
    const stmt = this.db.prepare(`
      UPDATE vault_secrets SET encryptedValue = ? WHERE id = ?
    `);

    const result = stmt.run(newEncrypted, id);
    return (result.changes || 0) > 0;
  }

  async deleteSecret(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM vault_secrets WHERE id = ?');
    const result = stmt.run(id);
    return (result.changes || 0) > 0;
  }
}
