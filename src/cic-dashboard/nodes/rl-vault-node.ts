/**
 * RL Vault Dashboard Node
 * Polls RL Vault status and exposes it on observability dashboard.
 */

import { vaultStatusService, VaultStatus } from "../../vector/vaultStatusService";

export interface RLVaultNodeData {
  id: "RL-VAULT";
  status: "ONLINE" | "DOWN" | "DEGRADED";
  lastSync: number;
  files: number;
  driftScore: number;
  chunkCount: number;
  embeddingCount: number;
  indexedCount: number;
  timestamp: number;
}

/**
 * Poll RL Vault status.
 * Returns data for dashboard consumption.
 */
export async function pollRLVault(): Promise<RLVaultNodeData> {
  const status: VaultStatus = await vaultStatusService.getStatus();

  return {
    id: "RL-VAULT",
    status: status.state,
    lastSync: status.lastSync,
    files: status.fileCount,
    driftScore: status.driftScore,
    chunkCount: status.chunkCount,
    embeddingCount: status.embeddingCount,
    indexedCount: status.indexedCount,
    timestamp: Date.now(),
  };
}

/**
 * Register RL Vault node in dashboard polling loop.
 */
export function registerRLVaultNode(
  dashboardNodes: Array<() => Promise<any>>
): void {
  dashboardNodes.push(pollRLVault);
}
