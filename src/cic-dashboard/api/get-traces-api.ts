import { pgQuery } from '../../cic-runtime/audit-log/postgres-client';

export async function getTracesApi(req: any, res: any) {
  const runId = req.params.runId;
  try {
    const { rows } = await pgQuery('SELECT network_trace_json, file_access_json FROM cic_audit_log WHERE run_id = $1', [runId]);
    if (!rows.length) return res.status(404).json({ error: "No traces found" });
    res.json({
      networkTrace: rows[0].network_trace_json || [],
      fileAccess: rows[0].file_access_json || []
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
