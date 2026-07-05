/**
 * Vault Status Service
 * Provides status information for RL Vault ingestion.
 */
export interface VaultStatus {
    state: "ONLINE" | "DOWN" | "DEGRADED";
    lastSync: number;
    fileCount: number;
    driftScore: number;
    chunkCount: number;
    embeddingCount: number;
    indexedCount: number;
}
declare class VaultStatusService {
    private statusFile;
    private lastStatus;
    constructor(statusFile?: string);
    /**
     * Get current vault status.
     */
    getStatus(): Promise<VaultStatus>;
    /**
     * Update vault status after ingestion.
     */
    updateStatus(updates: Partial<VaultStatus>): Promise<void>;
    /**
     * Mark vault as online after successful sync.
     */
    markOnline(stats: {
        fileCount: number;
        chunkCount: number;
        embeddingCount: number;
        indexedCount: number;
        driftScore?: number;
    }): Promise<void>;
    /**
     * Mark vault as degraded.
     */
    markDegraded(reason: string): Promise<void>;
    /**
     * Mark vault as down.
     */
    markDown(reason: string): Promise<void>;
    private loadStatus;
    private saveStatus;
}
export declare const vaultStatusService: VaultStatusService;
export {};
//# sourceMappingURL=vaultStatusService.d.ts.map