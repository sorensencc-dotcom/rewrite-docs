/**
 * RL Vault Dashboard Node
 * Polls RL Vault status and exposes it on observability dashboard.
 */
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
export declare function pollRLVault(): Promise<RLVaultNodeData>;
/**
 * Register RL Vault node in dashboard polling loop.
 */
export declare function registerRLVaultNode(dashboardNodes: Array<() => Promise<any>>): void;
//# sourceMappingURL=rl-vault-node.d.ts.map