/**
 * VaultClient — HTTP client for Vault (Phase 24 M3 endpoint)
 * Handles deterministic digest computation and CRUD
 */

import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { GovernancePacket } from '../types/GovernancePacket';

export class VaultClient {
  private http: AxiosInstance;

  constructor(baseUrl: string = 'http://localhost:3100') {
    this.http = axios.create({ baseURL: baseUrl });
  }

  private sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Write packet to Vault with computed digest
   */
  async write(
    packet: Omit<GovernancePacket, 'vaultDigest' | 'id' | 'createdAt'>
  ): Promise<GovernancePacket> {
    const createdAt = new Date().toISOString();
    const id = crypto.randomUUID();
    const base = { ...packet, id, createdAt };
    const vaultDigest = this.sha256(JSON.stringify(base));

    const res = await this.http.post('/vault/records', {
      ...base,
      vaultDigest,
    });

    return res.data as GovernancePacket;
  }

  /**
   * Query packets by proposal ID
   */
  async listByProposal(proposalId: string): Promise<GovernancePacket[]> {
    const res = await this.http.get('/vault/records', {
      params: { proposalId },
    });
    return (res.data || []) as GovernancePacket[];
  }

  /**
   * Get single packet by ID
   */
  async get(id: string): Promise<GovernancePacket | null> {
    try {
      const res = await this.http.get(`/vault/records/${id}`);
      return res.data as GovernancePacket;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }
}
