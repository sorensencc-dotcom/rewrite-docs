/**
 * Example: Starting a CIC Agent Runtime
 *
 * Usage:
 *   npx ts-node example-entrypoint.ts
 */

import path from 'path';
import pino from 'pino';
import { defineAgent } from './defineAgent.js';
import { fileURLToPath } from 'url';

async function main() {
  const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const agentPath = path.resolve(__dirname, '../cic-agent');
  const manifestPath = path.join(agentPath, 'pr-reviewer', 'agent.yaml');

  logger.info({ manifestPath }, 'Starting CIC agent runtime');

  try {
    // Define agent
    const agent = await defineAgent({
      manifestPath,
      logger,
    });

    // Start agent
    await agent.start();

    // Graceful shutdown on signals
    const signals = ['SIGTERM', 'SIGINT'];
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down`);
        await agent.stop();
        process.exit(0);
      });
    }

    logger.info('Agent runtime is running');
  } catch (err) {
    logger.error({ err }, 'Failed to start agent');
    process.exit(1);
  }
}

main();
