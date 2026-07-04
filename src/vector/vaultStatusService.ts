/**
 * Vault Status Service
 * Provides status information for RL Vault ingestion.
 */

import * as fs from "fs";
import { adapterLogger } from "../logging/adapterLogger";

export interface VaultStatus {
  state: "ONLINE" | "DOWN" | "DEGRADED";
  lastSync: number; // timestamp
  fileCount: number;
  driftScore: number;
  chunkCount: number;
  embeddingCount: number;
  indexedCount: number;
}

class VaultStatusService {
  private statusFile: string;
  private lastStatus: VaultStatus | null = null;

  constructor(
    statusFile: string = "C:\\dev\\data\\rl-vault-status.json"
  ) {
    this.statusFile = statusFile;
    this.loadStatus();
  }

  /**
   * Get current vault status.
   */
  async getStatus(): Promise<VaultStatus> {
    try {
      this.loadStatus();
      if (this.lastStatus) {
        return this.lastStatus;
      }
    } catch (err) {
      adapterLogger.error({ service: "vault-status", error: err });
    }

    // Default status if no file or error
    return {
      state: "DOWN",
      lastSync: 0,
      fileCount: 0,
      driftScore: 0,
      chunkCount: 0,
      embeddingCount: 0,
      indexedCount: 0,
    };
  }

  /**
   * Update vault status after ingestion.
   */
  async updateStatus(updates: Partial<VaultStatus>): Promise<void> {
    const current = this.lastStatus || (await this.getStatus());
    const updated: VaultStatus = {
      ...current,
      ...updates,
      lastSync: updates.lastSync ?? Date.now(),
    };

    this.lastStatus = updated;
    this.saveStatus(updated);
  }

  /**
   * Mark vault as online after successful sync.
   */
  async markOnline(stats: {
    fileCount: number;
    chunkCount: number;
    embeddingCount: number;
    indexedCount: number;
    driftScore?: number;
  }): Promise<void> {
    await this.updateStatus({
      state: "ONLINE",
      lastSync: Date.now(),
      fileCount: stats.fileCount,
      chunkCount: stats.chunkCount,
      embeddingCount: stats.embeddingCount,
      indexedCount: stats.indexedCount,
      driftScore: stats.driftScore ?? 0,
    });
  }

  /**
   * Mark vault as degraded.
   */
  async markDegraded(reason: string): Promise<void> {
    adapterLogger.warn({ service: "vault-status", reason });
    await this.updateStatus({
      state: "DEGRADED",
    });
  }

  /**
   * Mark vault as down.
   */
  async markDown(reason: string): Promise<void> {
    adapterLogger.error({ service: "vault-status", error: reason });
    await this.updateStatus({
      state: "DOWN",
    });
  }

  private loadStatus(): void {
    try {
      if (fs.existsSync(this.statusFile)) {
        const content = fs.readFileSync(this.statusFile, "utf-8");
        this.lastStatus = JSON.parse(content);
      }
    } catch (err) {
      adapterLogger.debug({ service: "vault-status", message: "Status file not found or invalid" });
    }
  }

  private saveStatus(status: VaultStatus): void {
    try {
      const dir = this.statusFile.substring(0, this.statusFile.lastIndexOf("\\"));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2), "utf-8");
    } catch (err) {
      adapterLogger.error({ service: "vault-status", saveError: err });
    }
  }
}

export const vaultStatusService = new VaultStatusService();
