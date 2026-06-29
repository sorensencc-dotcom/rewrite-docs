import { Request, Response } from 'express';
import { ReproducibilityResponse } from './api-types';
import { pgQuery } from '../audit-log/postgres-client';

export async function getReproducibilityApi(req: Request, res: Response) {
  const { runId } = req.params;

  try {
    const result = await pgQuery(
      `SELECT
        reproducibility_json->>'vmConfigHash' as vm_config_hash,
        reproducibility_json->>'envHash' as env_hash,
        reproducibility_json->>'fsHash' as fs_hash,
        reproducibility_json->>'snapshotHash' as snapshot_hash
       FROM cic_audit_log WHERE run_id = $1`,
      [runId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const { vm_config_hash, env_hash, fs_hash, snapshot_hash } = result.rows[0];
    const response: ReproducibilityResponse = {
      vmConfigHash: vm_config_hash || 'N/A',
      envHash: env_hash || 'N/A',
      fsHash: fs_hash || 'N/A',
      snapshotHash: snapshot_hash || 'N/A'
    };

    res.json(response);
  } catch (err) {
    console.error(`[GetReproducibilityApi] Error for run ${runId}:`, err);
    res.status(500).json({ error: 'Failed to fetch reproducibility data' });
  }
}
