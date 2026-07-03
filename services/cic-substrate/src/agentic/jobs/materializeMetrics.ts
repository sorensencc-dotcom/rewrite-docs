import { loadRuleContext } from '../context/loader';
import { RuleEngine } from '../rules/engine';
import { ruleRegistry } from '../rules/registry';
import { query } from '../../db';

const engine = new RuleEngine(ruleRegistry);

function hoursAgo(h: number) {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d;
}

function daysAgo(d: number) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date;
}

export async function materializeMetricsForUserWorkspace(userId: string, workspace: string) {
  const windows = [
    { start: hoursAgo(24), end: new Date() },
    { start: daysAgo(7), end: new Date() },
    { start: daysAgo(30), end: new Date() },
  ];

  for (const w of windows) {
    const ctx = await loadRuleContext({
      userId,
      workspace,
      windowStart: w.start,
      windowEnd: w.end,
    });

    const { metrics } = engine.evaluate(ctx);

    await query(
      `
      INSERT INTO agentic_metrics (
        user_id, workspace, window_start, window_end,
        prompt_discipline, context_health, review_rigor,
        skill_reuse, drift_index, readiness_index
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (user_id, workspace, window_start, window_end)
      DO UPDATE SET
        prompt_discipline = EXCLUDED.prompt_discipline,
        context_health = EXCLUDED.context_health,
        review_rigor = EXCLUDED.review_rigor,
        skill_reuse = EXCLUDED.skill_reuse,
        drift_index = EXCLUDED.drift_index,
        readiness_index = EXCLUDED.readiness_index
      `,
      [
        userId,
        workspace,
        w.start,
        w.end,
        metrics.promptDiscipline,
        metrics.contextHealth,
        metrics.reviewRigor,
        metrics.skillReuse,
        metrics.driftIndex,
        metrics.readinessIndex,
      ]
    );
  }
}
