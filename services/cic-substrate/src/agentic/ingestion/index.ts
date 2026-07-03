import { Request, Response } from 'express';
import { query } from '../../db';

const VALID_HARNESSES = ['cic', 'vscode', 'cli', 'copilot_app', 'other'];
const VALID_SURFACES = ['chat', 'completion', 'tool'];
const VALID_REVIEWERS = ['cic', 'maal', 'human', 'claude'];
const VALID_RESULTS = ['accepted', 'edited', 'rejected'];

export const ingestSession = async (req: Request, res: Response) => {
  try {
    const { id, userId, harness, workspace, startTime, endTime, tags } = req.body;
    if (!id || !userId || !harness || !workspace || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!VALID_HARNESSES.includes(harness)) {
      return res.status(400).json({ error: 'Invalid harness' });
    }

    const sql = `
      INSERT INTO agentic_sessions (id, user_id, harness, workspace, start_time, end_time, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET end_time = EXCLUDED.end_time
      RETURNING *;
    `;
    const values = [id, userId, harness, workspace, startTime, endTime || null, tags ? JSON.stringify(tags) : null];
    const result = await query(sql, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const ingestSessionRequest = async (req: Request, res: Response) => {
  try {
    const { id, sessionId, timestamp, model, surface, promptHash, promptSummary, tokensIn, tokensOut, latencyMs, status } = req.body;
    
    if (!id || !sessionId || !timestamp || !model || !surface || !promptHash || !promptSummary || tokensIn === undefined || tokensOut === undefined || latencyMs === undefined || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!VALID_SURFACES.includes(surface)) {
      return res.status(400).json({ error: 'Invalid surface' });
    }

    const sql = `
      INSERT INTO agentic_session_requests (id, session_id, timestamp, model, surface, prompt_hash, prompt_summary, tokens_in, tokens_out, latency_ms, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, latency_ms = EXCLUDED.latency_ms
      RETURNING *;
    `;
    const values = [id, sessionId, timestamp, model, surface, promptHash, promptSummary, tokensIn, tokensOut, latencyMs, status];
    const result = await query(sql, values);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const ingestContextSlice = async (req: Request, res: Response) => {
  try {
    const { id, sessionRequestId, source, sizeBytes, coverageScore, freshnessScore } = req.body;
    
    if (!id || !sessionRequestId || !source || sizeBytes === undefined || coverageScore === undefined || freshnessScore === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
      INSERT INTO agentic_context_slices (id, session_request_id, source, size_bytes, coverage_score, freshness_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `;
    const values = [id, sessionRequestId, source, sizeBytes, coverageScore, freshnessScore];
    const result = await query(sql, values);

    res.status(201).json(result.rows[0] || { id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const ingestReviewEvent = async (req: Request, res: Response) => {
  try {
    const { id, sessionRequestId, reviewer, result: revResult, diffSizeLines, commentsCount } = req.body;

    if (!id || !sessionRequestId || !reviewer || !revResult || diffSizeLines === undefined || commentsCount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!VALID_REVIEWERS.includes(reviewer)) {
      return res.status(400).json({ error: 'Invalid reviewer' });
    }
    if (!VALID_RESULTS.includes(revResult)) {
      return res.status(400).json({ error: 'Invalid result' });
    }

    const sql = `
      INSERT INTO agentic_review_events (id, session_request_id, reviewer, result, diff_size_lines, comments_count)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `;
    const values = [id, sessionRequestId, reviewer, revResult, diffSizeLines, commentsCount];
    const result = await query(sql, values);

    res.status(201).json(result.rows[0] || { id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
