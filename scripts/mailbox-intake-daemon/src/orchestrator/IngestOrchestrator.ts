import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/Logger';
import { DriveUploader } from './DriveUploader';
import { BatchManifest } from '../processor/BatchProcessor';

export interface RoutingConfig {
  tier1: TierRoute;
  tier2: TierRoute;
  tier3: TierRoute;
  unmappedTier: TierRoute;
}

export interface TierRoute {
  tier: 'tier-1-images' | 'tier-2-research' | 'tier-3-local';
  destination: string;
  uploadMethod: 'drive-api' | 'rclone' | 'local-copy';
  maxRetries: number;
}

export interface DriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  maxConcurrentUploads: number;
  chunkSizeMb: number;
  timeoutMs: number;
}

export interface UploadResult {
  batchId: string;
  totalFiles: number;
  successCount: number;
  failureCount: number;
  allSucceeded: boolean;
  completedAt: string;
}

export class IngestOrchestrator {
  private routingConfig: RoutingConfig;
  private driveConfig: DriveConfig;
  private logger: Logger;
  private driveUploader: DriveUploader;

  constructor(routingConfig: RoutingConfig, driveConfig: DriveConfig) {
    this.routingConfig = routingConfig;
    this.driveConfig = driveConfig;
    this.logger = new Logger('IngestOrchestrator');
    this.driveUploader = new DriveUploader(driveConfig);
  }

  async triggerIngest(batchDir: string): Promise<void> {
    const manifestPath = path.join(batchDir, 'manifest.json');
    const manifest: BatchManifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    const batchId = manifest.batch_id;

    this.logger.info(`Triggering ingest for batch ${batchId}`);

    try {
      // Route batch
      const route = this.routeBatch(manifest);
      const validation = this.validateRoutingDecision(manifest, route);

      if (!validation.valid) {
        this.logger.error(`Routing validation failed: ${validation.reason}`);
        await this.appendIntakeLog(batchDir, {
          timestamp: new Date().toISOString(),
          event: 'ingest_failed',
          reason: validation.reason,
          batchId,
        });
        return;
      }

      // Update manifest with ingest status
      manifest.ingest_status = {
        status: 'in_progress',
        started_at: new Date().toISOString(),
      };
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // Execute upload
      const uploadResult = await this.executeUpload(batchDir, manifest, route);

      // Update manifest
      manifest.ingest_status = {
        status: uploadResult.allSucceeded ? 'completed' : 'failed',
        started_at: manifest.ingest_status.started_at,
        completed_at: uploadResult.completedAt,
      };
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // Log completion
      await this.appendIntakeLog(batchDir, {
        timestamp: new Date().toISOString(),
        event: 'ingest_completed',
        batchId,
        uploadResult,
      });

      // Move to archive if successful
      if (uploadResult.allSucceeded) {
        await this.moveBatchToArchive(batchDir, batchId);
        this.logger.info(`Batch ${batchId} archived`);
      } else {
        await this.handleIngestFailure(batchDir, new Error('Upload failed'));
      }

      this.logger.info(`Ingest complete for batch ${batchId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Ingest failed for batch ${manifest.batch_id}: ${errorMsg}`);
      manifest.ingest_status = {
        status: 'failed',
        error: errorMsg,
        completed_at: new Date().toISOString(),
      };

      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      await this.appendIntakeLog(batchDir, {
        timestamp: new Date().toISOString(),
        event: 'ingest_failed',
        batchId: manifest.batch_id,
        error: errorMsg,
      });

      const error = err instanceof Error ? err : new Error(errorMsg);
      await this.handleIngestFailure(batchDir, error);
    }
  }

  private routeBatch(manifest: BatchManifest): TierRoute {
    const primaryTier = manifest.classification.primary_tier;

    let route: TierRoute;
    switch (primaryTier) {
      case 'tier-1':
        route = this.routingConfig.tier1;
        break;
      case 'tier-2':
        route = this.routingConfig.tier2;
        break;
      case 'tier-3':
        route = this.routingConfig.tier3;
        break;
      default:
        route = this.routingConfig.unmappedTier;
    }

    if (!route || !route.destination) {
      throw new Error(`Invalid routing configuration for tier: ${primaryTier}`);
    }
    return route;
  }

  private validateRoutingDecision(
    manifest: BatchManifest,
    route: TierRoute
  ): { valid: boolean; reason?: string } {
    if (manifest.classification.primary_tier === 'tier-2' && route.uploadMethod === 'local-copy') {
      return { valid: false, reason: 'Tier 2 must be uploaded to Drive' };
    }

    return { valid: true };
  }

  private async executeUpload(
    batchDir: string,
    manifest: BatchManifest,
    route: TierRoute
  ): Promise<UploadResult> {
    switch (route.uploadMethod) {
      case 'drive-api':
        return this.driveUploader.uploadBatch(batchDir, manifest, route.destination);

      case 'local-copy':
        return this.executeLocalCopy(batchDir, manifest, route.destination);

      default:
        throw new Error(`Unknown upload method: ${route.uploadMethod}`);
    }
  }

  private async executeLocalCopy(
    batchDir: string,
    manifest: BatchManifest,
    destination: string
  ): Promise<UploadResult> {
    const successFiles = manifest.attachments.filter((att) => att.extractionStatus === 'success');
    let successCount = 0;
    let failureCount = 0;

    for (const file of successFiles) {
      try {
        const srcPath = path.join(batchDir, file.fileName);
        const destPath = path.join(destination, manifest.batch_id, file.fileName);

        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copy(srcPath, destPath);

        successCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to copy file ${file.fileName}: ${errorMsg}`);
        failureCount++;
      }
    }

    return {
      batchId: manifest.batch_id,
      totalFiles: successFiles.length,
      successCount,
      failureCount,
      allSucceeded: failureCount === 0,
      completedAt: new Date().toISOString(),
    };
  }

  private async moveBatchToArchive(batchDir: string, batchId: string): Promise<void> {
    const archiveDir = path.join(path.dirname(path.dirname(batchDir)), 'archive', batchId);

    await fs.mkdir(archiveDir, { recursive: true });
    await fs.copy(batchDir, archiveDir);
    await fs.remove(batchDir);
  }

  private async handleIngestFailure(batchDir: string, error: Error): Promise<void> {
    const manifestPath = path.join(batchDir, 'manifest.json');
    const manifest: BatchManifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    const isRetryable = ['ECONNREFUSED', '503', 'ETIMEDOUT'].some((msg) =>
      error.message.includes(msg)
    );

    if (!isRetryable) {
      this.logger.error(`Non-retryable error for batch ${manifest.batch_id}`);
      manifest.ingest_status.status = 'failed';
      return;
    }

    const retryCount = (manifest.ingest_status as any).retry_count || 0;
    const maxRetries = 5;

    if (retryCount >= maxRetries) {
      this.logger.error(`Batch ${manifest.batch_id} exceeded max retries`);
      manifest.ingest_status.status = 'failed';
      return;
    }

    const nextRetryCount = retryCount + 1;
    const backoffMs = Math.pow(2, nextRetryCount) * 1000;
    const nextRetryAt = new Date(Date.now() + backoffMs);

    (manifest.ingest_status as any).retry_count = nextRetryCount;
    (manifest.ingest_status as any).next_retry_at = nextRetryAt.toISOString();

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    this.logger.info(
      `Scheduled retry ${nextRetryCount}/${maxRetries} for batch ${manifest.batch_id}`
    );

    setTimeout(() => {
      this.triggerIngest(batchDir).catch((err) =>
        this.logger.error(`Retry failed: ${err.message}`)
      );
    }, backoffMs);
  }

  private async appendIntakeLog(batchDir: string, entry: any): Promise<void> {
    const logPath = path.join(batchDir, 'intake.log');
    const logLine = JSON.stringify(entry) + '\n';
    await fs.appendFile(logPath, logLine);
  }
}
