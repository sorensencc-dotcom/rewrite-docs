import { pgQuery } from '../audit-log/postgres-client';
export async function getStabilityApi(req, res) {
    const { modelId } = req.params;
    try {
        const result = await pgQuery(`SELECT
        AVG(drift_score) as avg_drift,
        COUNT(*) as sample_count
       FROM cic_model_stability
       WHERE model_id = $1
       AND timestamp > NOW() - INTERVAL '24 hours'`, [modelId]);
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ error: 'Model not found' });
        }
        const { avg_drift, sample_count } = result.rows[0];
        const avgScore = avg_drift ? parseFloat(avg_drift) : 0;
        let level = 'low';
        if (avgScore > 0.30)
            level = 'high';
        else if (avgScore > 0.20)
            level = 'medium';
        const response = {
            avgScore,
            level
        };
        res.json(response);
    }
    catch (err) {
        console.error(`[GetStabilityApi] Error for model ${modelId}:`, err);
        res.status(500).json({ error: 'Failed to fetch stability data' });
    }
}
//# sourceMappingURL=get-stability-api.js.map