import { pgQuery } from '../audit-log/postgres-client';
export async function getTracesApi(req, res) {
    const { runId } = req.params;
    try {
        const result = await pgQuery('SELECT network_trace_json, file_access_json FROM cic_audit_log WHERE run_id = $1', [runId]);
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ error: 'Run not found' });
        }
        const { network_trace_json, file_access_json } = result.rows[0];
        const response = {
            networkTrace: network_trace_json ? JSON.parse(network_trace_json) : [],
            fileAccess: file_access_json ? JSON.parse(file_access_json) : []
        };
        res.json(response);
    }
    catch (err) {
        console.error(`[GetTracesApi] Error for run ${runId}:`, err);
        res.status(500).json({ error: 'Failed to fetch traces' });
    }
}
//# sourceMappingURL=get-traces-api.js.map