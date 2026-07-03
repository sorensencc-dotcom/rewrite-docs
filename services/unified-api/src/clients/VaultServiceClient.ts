/**
 * HTTP Client for Vault Service
 * Proxies calls to vault microservice
 */

export interface VaultRecord {
  id: string;
  kind: string;
  payload: unknown;
  timestamp: number;
  digest?: string;
}

export class VaultServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async writeRecord(kind: string, payload: unknown): Promise<VaultRecord> {
    const res = await fetch(`${this.baseUrl}/vault/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, payload }),
    });
    if (!res.ok) throw new Error(`Vault service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async readRecord(id: string): Promise<VaultRecord | null> {
    const res = await fetch(`${this.baseUrl}/vault/records/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Vault service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async listRecordsByKind(kind: string): Promise<VaultRecord[]> {
    const res = await fetch(`${this.baseUrl}/vault/records?kind=${encodeURIComponent(kind)}`);
    if (!res.ok) throw new Error(`Vault service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.records || [];
  }

  async deleteRecord(id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/vault/records/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Vault service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.deleted || false;
  }

  async writeSecret(value: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/vault/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`Vault service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.id;
  }

  async readSecret(id: string): Promise<string | null> {
    const res = await fetch(`${this.baseUrl}/vault/secrets/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Vault service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.value || null;
  }

  async rotateSecret(id: string, newValue: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/vault/secrets/${encodeURIComponent(id)}/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newValue }),
    });
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`Vault service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.rotated || false;
  }

  async getAuditLog(limit: number = 100): Promise<unknown[]> {
    const res = await fetch(`${this.baseUrl}/vault/audit-log?limit=${limit}`);
    if (!res.ok) throw new Error(`Vault service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.log || [];
  }
}
