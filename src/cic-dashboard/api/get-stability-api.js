import { pgQuery } from '../../cic-runtime/audit-log/postgres-client';
export async function getStabilityApi(req, res) {
    const modelId = req.params.modelId;
    try {
        // Average drift score over recent runs
        const { rows } = await pgQuery('SELECT AVG(drift_score) as avg_score FROM cic_model_stability WHERE model_id = $1', [modelId]);
        const avgScore = rows[0]?.avg_score ? parseFloat(rows[0].avg_score) : 0;
        const level = avgScore > 0.3 ? 'high' : avgScore > 0.1 ? 'medium' : 'low';
        res.json({ avgScore, level });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
}
//# sourceMappingURL=get-stability-api.js.map