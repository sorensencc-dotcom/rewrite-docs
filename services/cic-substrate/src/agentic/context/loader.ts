import { query } from '../../db';
import { RuleContext } from '../rules/types';

export interface LoadRuleContextParams {
  userId: string;
  workspace: string;
  windowStart: Date;
  windowEnd: Date;
}

export async function loadRuleContext(params: LoadRuleContextParams): Promise<RuleContext> {
  const { userId, workspace, windowStart, windowEnd } = params;

  // 1. Load sessions
  const sessions = await query(
    `
    SELECT *
    FROM agentic_sessions
    WHERE user_id = $1
      AND workspace = $2
      AND (
        start_time <= $4 AND (end_time IS NULL OR end_time >= $3)
      )
    `,
    [userId, workspace, windowStart, windowEnd]
  );

  const sessionIds = sessions.rows.map(s => s.id);
  if (sessionIds.length === 0) {
    return { sessions: [], requests: [], contexts: [], reviews: [] };
  }

  // 2. Load session requests
  const requests = await query(
    `
    SELECT *
    FROM agentic_session_requests
    WHERE session_id = ANY($1)
      AND timestamp BETWEEN $2 AND $3
    `,
    [sessionIds, windowStart, windowEnd]
  );

  const requestIds = requests.rows.map(r => r.id);

  // 3. Load context slices
  const contexts = requestIds.length
    ? (
        await query(
          `
          SELECT *
          FROM agentic_context_slices
          WHERE session_request_id = ANY($1)
          `,
          [requestIds]
        )
      ).rows
    : [];

  // 4. Load review events
  const reviews = requestIds.length
    ? (
        await query(
          `
          SELECT *
          FROM agentic_review_events
          WHERE session_request_id = ANY($1)
          `,
          [requestIds]
        )
      ).rows
    : [];

  return {
    sessions: sessions.rows,
    requests: requests.rows,
    contexts,
    reviews,
  };
}
