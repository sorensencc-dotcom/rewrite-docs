import { Request, Response } from 'express';
import { query } from '../../db';
import { loadRuleContext } from '../context/loader';
import { RuleEngine } from '../rules/engine';
import { ruleRegistry } from '../rules/registry';

const engine = new RuleEngine(ruleRegistry);

export async function getRuleFindings(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const workspace = req.query.workspace as string;
    const windowStart = req.query.windowStart as string;
    const windowEnd = req.query.windowEnd as string;
    const severity = req.query.severity as string;

    if (!userId || !workspace) {
      return res.status(400).json({ error: 'userId and workspace are required' });
    }

    // Case 1 — compute findings on demand
    if (windowStart && windowEnd) {
      const ctx = await loadRuleContext({
        userId,
        workspace,
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd),
      });

      const { findings } = engine.evaluate(ctx);

      const filtered = severity
        ? findings.filter(f => f.severity === severity)
        : findings;

      return res.json({
        count: filtered.length,
        findings: filtered,
      });
    }

    // Case 2 — use latest 24h window (materialized or fallback)
    const latest = await query(
      `
      SELECT window_start, window_end
      FROM agentic_metrics_latest
      WHERE user_id = $1 AND workspace = $2
      `,
      [userId, workspace]
    );

    if (latest.rows.length === 0) {
      return res.status(404).json({ error: 'No metrics available' });
    }

    const { window_start, window_end } = latest.rows[0];

    const ctx = await loadRuleContext({
      userId,
      workspace,
      windowStart: new Date(window_start),
      windowEnd: new Date(window_end),
    });

    const { findings } = engine.evaluate(ctx);

    const filtered = severity
      ? findings.filter(f => f.severity === severity)
      : findings;

    return res.json({
      count: filtered.length,
      findings: filtered,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
