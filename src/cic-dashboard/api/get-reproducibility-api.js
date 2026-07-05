import { pgQuery } from '../../cic-runtime/audit-log/postgres-client';
export async function getReproducibilityApi(req, res) {
    const runId = req.params.runId;
    try {
        const { rows } = await pgQuery('SELECT repro_metadata_json FROM cic_audit_log WHERE run_id = $1', [runId]);
        if (!rows.length)
            return res.status(404).json({ error: "No reproducibility stats found" });
        const meta = rows[0].repro_metadata_json || {};
        res.json({
            vmConfigHash: meta.vmConfigHash || 'N/A',
            envHash: meta.envHash || 'N/A',
            fsHash: meta.fsHash || 'N/A',
            snapshotHash: meta.snapshotHash || 'N/A'
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
}
//# sourceMappingURL=get-reproducibility-api.js.map