/**
 * Repomix Integration Routes (Phase 4.4)
 * Exposes Repomix analysis via HTTP
 *
 * Routes:
 * - POST /repomix/ingest — ingest a repository
 * - POST /repomix/ingest-batch — ingest multiple repositories
 */

import { Router, Request, Response, NextFunction } from 'express';
import { RepomixServiceClient } from '../clients/RepomixServiceClient';

export function createRepomixRouter(): Router {
  const router = Router();
  const repomixClient = new RepomixServiceClient(process.env.REPOMIX_URL || 'http://localhost:3112');

  /**
   * POST /repomix/ingest
   * Ingest a single repository
   *
   * Body: { repoPath: string }
   * Response: MemoryEvent[]
   */
  router.post('/repomix/ingest', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repoPath } = req.body;
      if (!repoPath) {
        return res.status(400).json({ error: 'repoPath required' });
      }

      const events = await repomixClient.ingest(repoPath);
      res.status(201).json({ repoPath, events, count: events.length });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /repomix/ingest-batch
   * Ingest multiple repositories
   *
   * Body: { repoPaths: string[] }
   * Response: { results: MemoryEvent[][], count: number }
   */
  router.post(
    '/repomix/ingest-batch',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { repoPaths } = req.body;
        if (!Array.isArray(repoPaths)) {
          return res.status(400).json({ error: 'repoPaths array required' });
        }

        const results = await repomixClient.ingestBatch(repoPaths);
        res.status(201).json({
          results,
          count: results.length,
          totalEvents: results.reduce((sum, r) => sum + r.length, 0),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
