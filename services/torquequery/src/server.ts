// TorqueQuery HTTP Server (Phase 26)

import express from 'express';
import { getTorqueQueryServer } from './server/TorqueQueryServer';
import { createWebhookRouter } from './shared/webhook-listener';
import { mcpXaiRouter } from './server/routes/mcp-xai';
import { Logger } from './shared/utils/logger';

const logger = new Logger('TorqueQueryServer');

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3110;

  // Middleware
  app.use(express.json());

  // Initialize TorqueQuery
  const torqueQuery = await getTorqueQueryServer();

  // Webhook routes (Phase 27)
  app.use('/webhooks', createWebhookRouter());

  // xAI Docs MCP Ingestion Routes (Phase 26)
  app.use('/mcp/xai', mcpXaiRouter);

  // Routes
  app.get('/torquequery/memory/by-type/:type', (req, res) => {
    try {
      const events = torqueQuery.getQueries().byType(req.params.type);
      res.json({ events, count: events.length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/torquequery/memory/by-agent/:agentId', (req, res) => {
    try {
      const events = torqueQuery.getQueries().byAgent(req.params.agentId);
      res.json({ events, count: events.length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/torquequery/memory/by-correlation/:correlationId', (req, res) => {
    try {
      const events = torqueQuery.getQueries().byCorrelation(req.params.correlationId);
      res.json({ events, count: events.length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/torquequery/memory/by-signal/:signalType', (req, res) => {
    try {
      const signals = torqueQuery.getQueries().bySignal(req.params.signalType);
      res.json({ signals, count: signals.length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // CIC Adapter Routes (Phase 27)
  app.post('/execute/:adapterName', async (req, res) => {
    try {
      const { ingestViaAdapter } = require('./handlers/cic-ingest');
      const result = await ingestViaAdapter(req.params.adapterName, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.post('/execute/batch/:adapterName', async (req, res) => {
    try {
      const { batchIngest } = require('./handlers/cic-ingest');
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Payload must be array' });
      }
      const result = await batchIngest(req.params.adapterName, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/execute/status', async (req, res) => {
    try {
      const { checkAdapterStatus } = require('./handlers/cic-ingest');
      const status = await checkAdapterStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.post('/execute/invalidate', async (req, res) => {
    try {
      const { invalidateCache } = require('./handlers/cic-ingest');
      const result = await invalidateCache();
      res.json({ status: 'invalidated', data: result });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // Ingest endpoints
  app.post('/torquequery/memory/ingest', (req, res) => {
    try {
      const { validateEvent } = require('./types/TorqueRecord');
      const validated = validateEvent(req.body);
      const indexer = torqueQuery.getIndexer();
      indexer.indexEvent(validated);
      res.status(201).json({ id: validated.id || 'generated', status: 'indexed' });
    } catch (err) {
      const statusCode = (err as any).name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({ error: (err as any).message });
    }
  });

  app.post('/torquequery/memory/ingest-batch', (req, res) => {
    try {
      const { validateEvent } = require('./types/TorqueRecord');
      const batch = req.body;

      if (!Array.isArray(batch)) {
        return res.status(400).json({ error: 'Batch must be array' });
      }

      const results: any[] = [];
      const indexer = torqueQuery.getIndexer();

      for (const eventReq of batch) {
        try {
          const validated = validateEvent(eventReq);
          indexer.indexEvent(validated);
          results.push({ id: validated.id || 'generated', status: 'indexed' });
        } catch (err) {
          results.push({ id: eventReq.id || 'unknown', status: 'error', error: (err as any).message });
        }
      }

      res.status(201).json({ events: results, total: batch.length, indexed: results.filter((r) => r.status === 'indexed').length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/torquequery/agent/:agentId/timeline', (req, res) => {
    try {
      const timeline = torqueQuery.getQueries().agentTimeline(req.params.agentId);
      res.json({ timeline, count: timeline.length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/torquequery/governance/history/:proposalId', (req, res) => {
    try {
      const history = torqueQuery.getQueries().governanceHistory(req.params.proposalId);
      res.json({ history, count: history.length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // Health check
  app.get('/health', (req, res) => {
    try {
      const healthy = torqueQuery.isHealthy();
      res.json({ status: healthy ? 'ok' : 'unhealthy', timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ status: 'error', message: (err as any).message });
    }
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', { message: err.message });
    res.status(500).json({ error: err.message });
  });

  // Start
  app.listen(port, () => {
    logger.info('TorqueQuery server listening', { port });
  });
}

// Start if run directly
if (require.main === module) {
  startServer().catch(err => {
    logger.error('Failed to start server', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
}

export { startServer };
