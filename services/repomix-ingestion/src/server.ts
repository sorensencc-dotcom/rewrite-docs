/**
 * Repomix Ingestion Service - HTTP Server (Phase 4.4)
 *
 * Exposes REST API for:
 * - Repository analysis and ingestion
 * - Batch repo processing
 * - Memory event generation
 */

import express, { Express, Request, Response } from 'express';
import { RepomixPipeline } from './RepomixPipeline';

const port = parseInt(process.env.REPOMIX_PORT || '3108', 10);

async function createServer(): Promise<Express> {
  const app = express();

  app.use(express.json());

  const pipeline = new RepomixPipeline();

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'repomix-ingestion' });
  });

  // Ingest single repository
  app.post('/api/repomix/ingest', async (req: Request, res: Response) => {
    try {
      const { repoPath } = req.body;
      if (!repoPath) {
        res.status(400).json({ error: 'repoPath is required' });
        return;
      }
      const events = await pipeline.ingest(repoPath);
      res.json({ success: true, eventCount: events.length, events });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Ingest multiple repositories
  app.post('/api/repomix/ingest-batch', async (req: Request, res: Response) => {
    try {
      const { repoPaths } = req.body;
      if (!repoPaths || !Array.isArray(repoPaths)) {
        res.status(400).json({ error: 'repoPaths array is required' });
        return;
      }
      const results = await pipeline.ingestBatch(repoPaths);
      res.json({
        success: true,
        repoCount: repoPaths.length,
        eventCounts: results.map(r => r.length),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return app;
}

async function main() {
  try {
    const app = await createServer();
    app.listen(port, () => {
      console.log(`Repomix Ingestion service listening on port ${port}`);
    });
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
