/**
 * CIC Agent Runtime Server
 * HTTP API wrapper for agent deployment + management
 */

import express, { Express, Request, Response } from 'express';
import path from 'path';
import pino from 'pino';
import { defineAgent } from './defineAgent.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = parseInt(process.env.PORT || '3118', 10);
const logLevel = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

interface DeploymentRequest {
  agentId: string;
  manifestPath?: string;
}

let runtimeAgents: Map<string, any> = new Map();

async function createServer(): Promise<Express> {
  const app = express();

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'cic-runtime', agents: runtimeAgents.size });
  });

  // Deploy agent endpoint
  app.post('/api/agents/deploy', async (req: Request, res: Response) => {
    try {
      const { agentId, manifestPath } = req.body as DeploymentRequest;

      if (!agentId) {
        return res.status(400).json({ error: 'agentId required' });
      }

      // Resolve manifest path (default to cic-agent/<agentId>/agent.yaml)
      const resolvedPath = manifestPath || path.join(__dirname, '..', 'cic-agent', agentId, 'agent.yaml');

      logger.info({ agentId, manifestPath: resolvedPath }, 'Deploying agent');

      // Define and start agent
      const agent = await defineAgent({
        manifestPath: resolvedPath,
        logger: logger.child({ agentId }),
      });

      await agent.start();

      runtimeAgents.set(agentId, agent);

      res.json({ agentId, status: 'deployed', port });
    } catch (error) {
      logger.error({ error }, 'Agent deployment failed');
      res.status(500).json({ error: String(error) });
    }
  });

  // List deployed agents endpoint
  app.get('/api/agents', (req: Request, res: Response) => {
    res.json({
      agents: Array.from(runtimeAgents.keys()),
      count: runtimeAgents.size,
    });
  });

  // Stop agent endpoint
  app.post('/api/agents/:agentId/stop', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;

      const agent = runtimeAgents.get(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      await agent.stop();
      runtimeAgents.delete(agentId);

      res.json({ agentId, status: 'stopped' });
    } catch (error) {
      logger.error({ error }, 'Agent stop failed');
      res.status(500).json({ error: String(error) });
    }
  });

  return app;
}

async function main() {
  try {
    const app = await createServer();
    app.listen(port, () => {
      logger.info({ port }, 'CIC Agent Runtime listening');
    });
  } catch (err) {
    logger.error({ err }, 'Fatal error');
    process.exit(1);
  }
}

main();
