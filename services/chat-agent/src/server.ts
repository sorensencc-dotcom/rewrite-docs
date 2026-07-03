import express from 'express';
import pipelineRouter from './routes/pipeline';
import { createWebhookRouter } from './shared/webhook-listener';
import { Logger } from './shared/utils/logger';

const logger = new Logger('ChatAgentServer');

async function startServer() {
  const app = express();
  const port = process.env.PORT || 8000;

  // Middleware
  app.use(express.json());

  // Routes
  app.use('/pipeline', pipelineRouter);
  app.use('/webhooks', createWebhookRouter());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'chat-agent', timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', { message: err.message });
    res.status(500).json({ error: err.message });
  });

  // Start
  app.listen(port, () => {
    logger.info('Chat-Agent server listening', { port });
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start server', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
}

export { startServer };
