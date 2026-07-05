// src/cic-runtime/audit-log.ts
import fs from "fs";
import path from "path";
/**
 * PostgreSQL client placeholder.
 * Gemini will implement the actual DB client in Phase Sandbox‑2.
 */
let pgClient = null;
/**
 * Initialize PostgreSQL client (optional).
 * If not called, JSONL fallback is used.
 */
export function initAuditLogPostgres(client) {
    pgClient = client;
}
/**
 * Convert RunManifest → AuditLogRecord
 */
function toAuditLogRecord(manifest) {
    return {
        runId: manifest.runId,
        timestamp: manifest.timestamp,
        userId: manifest.userId,
        modelId: manifest.model.id,
        modelVersion: manifest.model.version,
        sandboxTier: manifest.sandbox.tier,
        isolationLevel: manifest.sandbox.isolationLevel,
        determinism: manifest.sandbox.determinism,
        envHash: manifest.environment.envHash,
        inputHash: manifest.input.inputHash,
        manifestHash: manifest.reproducibility.manifestHash,
        sloLatencyOk: manifest.telemetry.sloCompliance.latency,
        sloIsolationOk: manifest.telemetry.sloCompliance.isolation,
        sloReliabilityOk: manifest.telemetry.sloCompliance.reliability,
        driftScore: manifest.telemetry.drift.driftScore,
        violationType: manifest.execution.violation?.type,
        manifest
    };
}
/**
 * Append-only ingestion into PostgreSQL or JSONL fallback.
 */
export async function ingestRunManifest(manifest) {
    const record = toAuditLogRecord(manifest);
    // --- PostgreSQL path ---
    if (pgClient) {
        await pgClient.query(`
      INSERT INTO cic_audit_log (
        run_id, timestamp, user_id,
        model_id, model_version,
        sandbox_tier, isolation_level, determinism,
        env_hash, input_hash, manifest_hash,
        slo_latency_ok, slo_isolation_ok, slo_reliability_ok,
        drift_score, violation_type,
        manifest_json
      ) VALUES (
        $1, $2, $3,
        $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16,
        $17
      )
      `, [
            record.runId,
            record.timestamp,
            record.userId ?? null,
            record.modelId,
            record.modelVersion,
            record.sandboxTier,
            record.isolationLevel,
            record.determinism,
            record.envHash,
            record.inputHash,
            record.manifestHash,
            record.sloLatencyOk,
            record.sloIsolationOk,
            record.sloReliabilityOk,
            record.driftScore,
            record.violationType ?? null,
            JSON.stringify(record.manifest)
        ]);
        return;
    }
    // --- JSONL fallback path ---
    const jsonlPath = path.join(process.cwd(), "cic-audit-log.jsonl");
    const line = JSON.stringify(record) + "\n";
    fs.appendFileSync(jsonlPath, line, "utf8");
}
//# sourceMappingURL=audit-log.js.map