// src/cic-runtime/audit-log/ingest-run-manifest.ts
import { pgQuery } from "./postgres-client";
/**
 * Flatten RunManifest → cic_audit_log row.
 */
function flattenManifest(manifest) {
    return {
        run_id: manifest.runId,
        timestamp: manifest.timestamp,
        user_id: manifest.userId ?? null,
        model_id: manifest.model.id,
        model_version: manifest.model.version,
        sandbox_tier: manifest.sandbox.tier,
        isolation_level: manifest.sandbox.isolationLevel,
        determinism: manifest.sandbox.determinism,
        env_hash: manifest.environment.envHash,
        input_hash: manifest.input.inputHash,
        manifest_hash: manifest.reproducibility.manifestHash,
        slo_latency_ok: manifest.telemetry.sloCompliance.latency,
        slo_isolation_ok: manifest.telemetry.sloCompliance.isolation,
        slo_reliability_ok: manifest.telemetry.sloCompliance.reliability,
        drift_score: manifest.telemetry.drift.driftScore,
        violation_type: manifest.execution.violation?.type ?? null,
        manifest_json: manifest
    };
}
/**
 * Authoritative ingestion into PostgreSQL.
 */
export async function ingestRunManifest(manifest) {
    const row = flattenManifest(manifest);
    await pgQuery(`
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
        row.run_id,
        row.timestamp,
        row.user_id,
        row.model_id,
        row.model_version,
        row.sandbox_tier,
        row.isolation_level,
        row.determinism,
        row.env_hash,
        row.input_hash,
        row.manifest_hash,
        row.slo_latency_ok,
        row.slo_isolation_ok,
        row.slo_reliability_ok,
        row.drift_score,
        row.violation_type,
        JSON.stringify(row.manifest_json)
    ]);
}
//# sourceMappingURL=ingest-run-manifest.js.map