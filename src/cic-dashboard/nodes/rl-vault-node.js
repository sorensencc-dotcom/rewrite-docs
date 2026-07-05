/**
 * RL Vault Dashboard Node
 * Polls RL Vault status and exposes it on observability dashboard.
 */
import { vaultStatusService } from "../../vector/vaultStatusService";
/**
 * Poll RL Vault status.
 * Returns data for dashboard consumption.
 */
export async function pollRLVault() {
    const status = await vaultStatusService.getStatus();
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
export function registerRLVaultNode(dashboardNodes) {
    dashboardNodes.push(pollRLVault);
}
//# sourceMappingURL=rl-vault-node.js.map