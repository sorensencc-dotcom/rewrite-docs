import { Request, Response } from 'express';
import { LatencyResponse } from './api-types';
import { pgQuery } from '../audit-log/postgres-client';

export async function getLatencyApi(req: Request, res: Response) {
  const { runId } = req.params;

  try {
    const result = await pgQuery(
      'SELECT latency_ms, slo_violated FROM cic_audit_log WHERE run_id = $1',
      [runId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const { latency_ms, slo_violated } = result.rows[0];
    const response: LatencyResponse = {
      latencyMs: latency_ms || 0,
      sloViolated: slo_violated || false
    };

    res.json(response);
  } catch (err) {
    console.error(`[GetLatencyApi] Error for run ${runId}:`, err);
    res.status(500).json({ error: 'Failed to fetch latency' });
  }
}
