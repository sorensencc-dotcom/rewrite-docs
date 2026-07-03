import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/Logger';

export interface FileWatcherConfig {
  watchDir: string;
  debounceMs: number;
  enablePolling: boolean;
  pollingIntervalMs: number;
  ignorePatterns: string[];
}

export class FileWatcher {
  private config: FileWatcherConfig;
  private logger: Logger;
  private watcher: chokidar.FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout>;
  private poller: BatchPoller;
  private pollHandle: NodeJS.Timeout | null = null;

  constructor(config: FileWatcherConfig) {
    this.config = config;
    this.logger = new Logger('FileWatcher');
    this.debounceTimers = new Map();
    this.poller = new BatchPoller(config);
  }

  async start(onBatchReady: (batchDir: string) => Promise<void>): Promise<void> {
    this.logger.info(`Starting file watcher on ${this.config.watchDir}`);

    this.watcher = chokidar.watch(this.config.watchDir, {
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
      ignored: this.config.ignorePatterns,
      usePolling: this.config.enablePolling,
      interval: this.config.pollingIntervalMs,
    });

    this.watcher.on('add', (filePath) => {
      if (filePath.endsWith('manifest.json')) {
        this.debounceManifestDetected(filePath, onBatchReady);
      }
    });

    this.watcher.on('error', (err: any) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`File watcher error: ${errorMsg}`);
      if (!this.config.enablePolling) {
        this.logger.info('Falling back to polling');
        this.poller.start(onBatchReady).catch((e: any) => {
          const errMsg = e instanceof Error ? e.message : String(e);
          this.logger.error(`Poller error: ${errMsg}`);
        });
      }
    });

    if (this.config.enablePolling) {
      await this.poller.start(onBatchReady);
    }

    this.logger.info('File watcher ready');
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.logger.info('File watcher stopped');
    }

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    await this.poller.stop();
  }

  private debounceManifestDetected(
    manifestPath: string,
    onBatchReady: (batchDir: string) => Promise<void>
  ): void {
    const batchId = path.basename(path.dirname(manifestPath));

    if (this.debounceTimers.has(batchId)) {
      clearTimeout(this.debounceTimers.get(batchId));
    }

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(batchId);

      const batchDir = path.dirname(manifestPath);
      const isReady = await this.isBatchReady(batchDir);

      if (isReady) {
        try {
          await onBatchReady(batchDir);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Batch processing failed: ${errorMsg}`);
        }
      }
    }, this.config.debounceMs);

    this.debounceTimers.set(batchId, timer);
  }

  async isBatchReady(batchDir: string): Promise<boolean> {
    const manifestPath = path.join(batchDir, 'manifest.json');

    if (!(await this.fileExists(manifestPath))) {
      return false;
    }

    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      if (!manifest.batch_id) {
        return false;
      }
    } catch {
      return false;
    }

    const intakePath = path.join(batchDir, 'intake.log');
    if (!(await this.fileExists(intakePath))) {
      return false;
    }

    return true;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

class BatchPoller {
  private config: FileWatcherConfig;
  private logger: Logger;
  private running: boolean = false;
  private pollHandle: NodeJS.Timeout | null = null;
  private processedBatches: Set<string>;

  constructor(config: FileWatcherConfig) {
    this.config = config;
    this.logger = new Logger('BatchPoller');
    this.processedBatches = new Set();
  }

  async start(onBatchReady: (batchDir: string) => Promise<void>): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    this.logger.info(`Starting batch poller (interval: ${this.config.pollingIntervalMs}ms)`);

    this.pollHandle = setInterval(async () => {
      try {
        await this.pollOnce(onBatchReady);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Poll cycle failed: ${errorMsg}`);
      }
    }, this.config.pollingIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.running) {
      this.running = false;
      if (this.pollHandle) {
        clearInterval(this.pollHandle);
      }
      this.logger.info('Batch poller stopped');
    }
  }

  private async pollOnce(onBatchReady: (batchDir: string) => Promise<void>): Promise<void> {
    const pendingDir = path.join(this.config.watchDir, 'pending');

    try {
      const batches = await fs.readdir(pendingDir);

      for (const batchId of batches) {
        if (this.processedBatches.has(batchId)) {
          continue;
        }

        const batchDir = path.join(pendingDir, batchId);
        const manifestPath = path.join(batchDir, 'manifest.json');

        if (await this.fileExists(manifestPath)) {
          const watcher = new FileWatcher(this.config);
          const isReady = await watcher.isBatchReady(batchDir);

          if (isReady) {
            this.processedBatches.add(batchId);
            try {
              await onBatchReady(batchDir);
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : String(err);
              this.logger.error(`Batch processing failed: ${errorMsg}`);
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Polling error: ${errorMsg}`);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
