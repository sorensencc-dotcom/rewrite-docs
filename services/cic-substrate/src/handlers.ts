import { Request, Response } from 'express';
import { query } from './db';
import { processIngestion } from './ingestion';
import { searchHybrid } from './retrieval';
import { getContextForTask } from './context';
import { applyGovernance, createGovernanceMiddleware } from './governance';
import { agenticEventSink } from './agentic';
import * as crypto from 'crypto';
// POST /chunks
export const storeChunk = async (req: Request, res: Response) => {
  try {
    const { embedding, ...data } = req.body;
    const chunk = await processIngestion(data, embedding);
    res.status(201).json(chunk);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// PUT /chunks/:id
export const updateChunk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { embedding, ...data } = req.body;

    // We must validate via governance
    const chunk = applyGovernance(data as any);

    const updateQuery = `
      UPDATE tq_chunks 
      SET 
        namespace = $2, type = $3, title = $4, body = $5, 
        tags = $6, importance = $7, ttl_days = $8, provenance = $9, 
        version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *;
    `;
    const values = [
      id, chunk.namespace, chunk.type, chunk.title, chunk.body,
      chunk.tags, chunk.importance, chunk.ttl_days, JSON.stringify(chunk.provenance)
    ];

    const result = await query(updateQuery, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Chunk not found' });
    }

    if (embedding && embedding.length === 1536) {
      const updateVectorQuery = `
        INSERT INTO tq_vectors (chunk_id, embedding)
        VALUES ($1, $2)
        ON CONFLICT (chunk_id) DO UPDATE SET embedding = EXCLUDED.embedding
      `;
      await query(updateVectorQuery, [id, `[${embedding.join(',')}]`]);
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /chunks/:id
export const deleteChunk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Soft delete
    const result = await query(`
      UPDATE tq_chunks SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id;
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Chunk not found' });
    }
    
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// GET /chunks/:id
export const getChunk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT * FROM tq_chunks WHERE id = $1 AND deleted_at IS NULL;
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Chunk not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// POST /chunks/list
export const listChunks = async (req: Request, res: Response) => {
  try {
    const { namespace, limit = 50, offset = 0 } = req.body;
    let sql = `SELECT * FROM tq_chunks WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (namespace) {
      sql += ` AND namespace = $1`;
      params.push(namespace);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// POST /search/hybrid
export const searchHybridHandler = async (req: Request, res: Response) => {
  try {
    const results = await searchHybrid(req.body);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// POST /context/task
export const getContextForTaskHandler = async (req: Request, res: Response) => {
  try {
    const context = await getContextForTask(req.body);
    res.json(context);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// GET /stats
export const getStats = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_chunks,
        SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as active_chunks,
        type,
        namespace
      FROM tq_chunks
      GROUP BY type, namespace;
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// POST /workflow/start
export const handleWorkflow = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || 'system';
    const workspace = req.body.workspace || 'default';

    const session = {
      id: `sess-${crypto.randomUUID()}`,
      userId,
      harness: 'cic' as const,
      workspace,
      startTime: new Date().toISOString(),
    };
    await agenticEventSink.emitSession(session);

    // Evaluate Governance based on agentic metrics
    const evaluateGovernance = createGovernanceMiddleware();
    const decision = await evaluateGovernance(userId, workspace);

    if (decision.requireClaudeReview) {
      // Governance review required
    }
    if (decision.requireMaalAudit) {
      // MAAL audit required
    }

    const sessionRequest = {
      id: `req-${crypto.randomUUID()}`,
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      model: req.body.model || 'gemini-2.0-pro',
      surface: 'chat' as const,
      promptHash: 'mock-hash',
      promptSummary: 'mock summary',
      tokensIn: 100,
      tokensOut: 200,
      latencyMs: 1500,
      status: 'ok' as const,
    };
    await agenticEventSink.emitSessionRequest(sessionRequest);

    res.status(201).json({ success: true, session, sessionRequest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
