import { Request, Response } from 'express';
import { query } from '../../db';
import { loadRuleContext } from '../context/loader';
import { RuleEngine } from '../rules/engine';
import { ruleRegistry } from '../rules/registry';
import { computeDriftIndex } from '../metrics/drift';

const engine = new RuleEngine(ruleRegistry);

export async function getDrift(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const workspace = req.query.workspace as string;
    const windowStart = req.query.windowStart as string;
    const windowEnd = req.query.windowEnd as string;

    if (!userId || !workspace) {
      return res.status(400).json({ error: 'userId and workspace are required' });
    }

    // Case 1 — compute drift on demand
    if (windowStart && windowEnd) {
      const ctx = await loadRuleContext({
        userId,
        workspace,
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd),
      });

      const { findings, metrics } = engine.evaluate(ctx);

      const violationRate = findings.length / Math.max(1, ctx.requests.length);
      const errorRate =
        ctx.requests.filter(r => r.status !== 'ok').length /
        Math.max(1, ctx.requests.length);
      const contextDecay = 1 - metrics.contextHealth;

      const driftAnalysis = computeDriftIndex({
        violationRate,
        errorRate,
        contextHealth: metrics.contextHealth,
        findings,
        totalRequests: ctx.requests.length,
      });

      return res.json({
        driftIndex: driftAnalysis.driftIndex,
        violationRate,
        errorRate,
        contextDecay,
        contributors: driftAnalysis.contributors,
      });
    }

    // Case 2 — return latest materialized drift
    const result = await query(
      `
      SELECT drift_index
      FROM agentic_metrics_latest
      WHERE user_id = $1 AND workspace = $2
      `,
      [userId, workspace]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No drift metrics available' });
    }

    return res.json({
      driftIndex: result.rows[0].drift_index,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
