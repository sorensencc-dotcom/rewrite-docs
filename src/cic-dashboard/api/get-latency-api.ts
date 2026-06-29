import { pgQuery } from '../../cic-runtime/audit-log/postgres-client';

export async function getLatencyApi(req: any, res: any) {
  const runId = req.params.runId;
  try {
    const { rows } = await pgQuery('SELECT latency_ms, slo_violated FROM cic_audit_log WHERE run_id = $1', [runId]);
    if (!rows.length) return res.status(404).json({ error: "No latency stats found" });
    res.json({
      latencyMs: rows[0].latency_ms,
      sloViolated: rows[0].slo_violated
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
