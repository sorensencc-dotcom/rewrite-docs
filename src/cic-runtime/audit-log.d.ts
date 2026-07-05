import { RunManifest } from "../cic/types/run-manifest";
/**
 * AuditLogRecord is the flattened, indexed representation of a RunManifest.
 * This is what gets stored in PostgreSQL or JSONL.
 */
export interface AuditLogRecord {
    runId: string;
    timestamp: string;
    userId?: string;
    modelId: string;
    modelVersion: string;
    sandboxTier: "S0" | "S1" | "S2" | "S3";
    isolationLevel: string;
    determinism: string;
    envHash: string;
    inputHash: string;
    manifestHash: string;
    sloLatencyOk: boolean;
    sloIsolationOk: boolean;
    sloReliabilityOk: boolean;
    driftScore: number;
    violationType?: string;
    manifest: RunManifest;
}
/**
 * Initialize PostgreSQL client (optional).
 * If not called, JSONL fallback is used.
 */
export declare function initAuditLogPostgres(client: any): void;
/**
 * Append-only ingestion into PostgreSQL or JSONL fallback.
 */
export declare function ingestRunManifest(manifest: RunManifest): Promise<void>;
//# sourceMappingURL=audit-log.d.ts.map