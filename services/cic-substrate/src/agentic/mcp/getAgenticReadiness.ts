import { Request, Response } from 'express';
import { query } from '../../db';
import { loadRuleContext } from '../context/loader';
import { RuleEngine } from '../rules/engine';
import { ruleRegistry } from '../rules/registry';

const engine = new RuleEngine(ruleRegistry);

export async function getAgenticReadiness(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const workspace = req.query.workspace as string;
    const windowStart = req.query.windowStart as string;
    const windowEnd = req.query.windowEnd as string;

    if (!userId || !workspace) {
      return res.status(400).json({ error: 'userId and workspace are required' });
    }

    if (windowStart && windowEnd) {
      // Compute metrics on demand
      const ctx = await loadRuleContext({
        userId,
        workspace,
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd),
      });

      const { metrics } = engine.evaluate(ctx);
      return res.json(metrics);
    }

    // Otherwise return latest materialized metrics
    const result = await query(
      `
      SELECT *
      FROM agentic_metrics_latest
      WHERE user_id = $1 AND workspace = $2
      `,
      [userId, workspace]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No metrics available' });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
