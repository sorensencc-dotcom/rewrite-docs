export interface VaultWriteOptions {
    endpoint: string;
    apiKey: string;
    timeoutMs?: number;
}
export declare function computeVaultRecordDigest(record: unknown, algorithm?: "sha256" | "sha512"): string;
export declare function writeGovernanceVaultRecord(record: unknown, options: VaultWriteOptions): Promise<{
    id: string;
    digest: string;
}>;
//# sourceMappingURL=write.d.ts.map