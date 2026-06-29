// src/cic-dashboard/api/get-audit-log.ts

import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";

/**
 * API: Query audit log with optional filters.
 */
export async function getAuditLog(filters: {
  modelId?: string;
  sandboxTier?: string;
  minDrift?: number;
  maxDrift?: number;
}) {
  const clauses: string[] = [];
  const params: any[] = [];

  if (filters.modelId) {
    params.push(filters.modelId);
    clauses.push(`model_id = $${params.length}`);
  }

  if (filters.sandboxTier) {
    params.push(filters.sandboxTier);
    clauses.push(`sandbox_tier = $${params.length}`);
  }

  if (filters.minDrift !== undefined) {
    params.push(filters.minDrift);
    clauses.push(`drift_score >= $${params.length}`);
  }

  if (filters.maxDrift !== undefined) {
    params.push(filters.maxDrift);
    clauses.push(`drift_score <= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await pgQuery(
    `
    SELECT
      run_id,
      timestamp,
      model_id,
      model_version,
      sandbox_tier,
      drift_score,
      slo_latency_ok,
      slo_isolation_ok,
      slo_reliability_ok,
      violation_type
    FROM cic_audit_log
    ${where}
    ORDER BY timestamp DESC
    LIMIT 500
    `,
    params
  );

  return result.rows;
}
