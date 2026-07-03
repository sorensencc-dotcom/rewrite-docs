import { MailpitClient } from './client/MailpitClient';
import { BatchProcessor } from './processor/BatchProcessor';
import { FileWatcher } from './watcher/FileWatcher';
import { IngestOrchestrator } from './orchestrator/IngestOrchestrator';
import { Logger } from './utils/Logger';
import { loadConfig } from './config';

const logger = new Logger('daemon');

async function main() {
  try {
    const config = loadConfig();
    logger.info('Mailbox Intake Daemon starting', { config: sanitizeConfig(config) });

    // Initialize components
    const mailpitClient = new MailpitClient(config.mailpit);
    const batchProcessor = new BatchProcessor(config.validation, config.classification, mailpitClient);
    const fileWatcher = new FileWatcher(config.watcher);
    const ingestOrchestrator = new IngestOrchestrator(config.routing, config.drive);

    // Health check
    await mailpitClient.connect();
    logger.info('Mailpit API connection verified');

    // Start polling
    const poller = mailpitClient.startPolling(async (messages) => {
      logger.debug(`Processing ${messages.length} messages`);
      for (const msg of messages) {
        try {
          const batch = await batchProcessor.processMessage(msg);
          await ingestOrchestrator.triggerIngest(batch.batchDir);
        } catch (err) {
          logger.error(`Failed to process message ${msg.id}`, { error: err });
        }
      }
    });

    // Start file watcher
    await fileWatcher.start(async (batchDir) => {
      logger.info(`Batch ready for ingest: ${batchDir}`);
      try {
        await ingestOrchestrator.triggerIngest(batchDir);
      } catch (err) {
        logger.error(`Ingest failed for batch ${batchDir}`, { error: err });
      }
    });

    logger.info('Daemon ready (polling + file watcher active)');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down');
      poller.stop();
      await fileWatcher.stop();
      process.exit(0);
    });
  } catch (err) {
    logger.error('Daemon startup failed', { error: err });
    process.exit(1);
  }
}

function sanitizeConfig(config: any): any {
  const sanitized = JSON.parse(JSON.stringify(config));
  if (sanitized.drive?.clientSecret) sanitized.drive.clientSecret = '***';
  if (sanitized.drive?.refreshToken) sanitized.drive.refreshToken = '***';
  return sanitized;
}

main();
