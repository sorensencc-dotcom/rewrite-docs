import PQueue from 'p-queue';
import fs from 'fs-extra';
import path from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from '../utils/Logger';
import { BatchManifest } from '../processor/BatchProcessor';
import { DriveConfig, UploadResult } from './IngestOrchestrator';

export class DriveUploader {
  private config: DriveConfig;
  private logger: Logger;
  private drive: any;
  private uploadQueue: PQueue;
  private oauth2Client: OAuth2Client | null = null;

  constructor(config: DriveConfig) {
    this.config = config;
    this.logger = new Logger('DriveUploader');
    this.uploadQueue = new PQueue({ concurrency: config.maxConcurrentUploads });
    this.initializeAuth();
  }

  private initializeAuth(): void {
    this.oauth2Client = new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      'http://localhost:3000/oauth2callback'
    );

    this.oauth2Client.setCredentials({
      refresh_token: this.config.refreshToken,
    });

    this.drive = google.drive({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  async uploadBatch(
    batchDir: string,
    manifest: BatchManifest,
    folderId: string
  ): Promise<UploadResult> {
    const fileEntries = manifest.attachments
      .filter((att) => att.extractionStatus === 'success')
      .map((att) => ({
        fileName: att.fileName,
        localPath: path.join(batchDir, att.fileName),
        mimeType: att.mimeType,
      }));

    this.logger.info(`Uploading ${fileEntries.length} files to Drive folder ${folderId}`);

    const uploadPromises = fileEntries.map((entry) =>
      this.uploadQueue.add(() =>
        this.uploadFileWithRetry(entry, folderId).catch((err) => ({
          error: err,
          entry,
        }))
      )
    );

    const uploadResults = await Promise.allSettled(uploadPromises);

    const successful = uploadResults.filter((r) => r.status === 'fulfilled').length;
    const failed = uploadResults.filter((r) => r.status === 'rejected').length;

    this.logger.info(`Upload complete: ${successful} succeeded, ${failed} failed`);

    return {
      batchId: manifest.batch_id,
      totalFiles: fileEntries.length,
      successCount: successful,
      failureCount: failed,
      allSucceeded: failed === 0,
      completedAt: new Date().toISOString(),
    };
  }

  private async uploadFileWithRetry(
    entry: { fileName: string; localPath: string; mimeType: string },
    folderId: string,
    attempt: number = 1
  ): Promise<void> {
    const maxRetries = 3;
    const backoffMs = [500, 1000, 2000];

    try {
      await this.uploadFileToDrive(entry, folderId);
    } catch (err) {
      if (attempt < maxRetries && this.isRetryableError(err)) {
        const delay = backoffMs[attempt - 1];
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Upload attempt ${attempt} failed, retrying in ${delay}ms: ${errorMsg}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.uploadFileWithRetry(entry, folderId, attempt + 1);
      }
      throw err;
    }
  }

  private async uploadFileToDrive(
    entry: { fileName: string; localPath: string; mimeType: string },
    folderId: string
  ): Promise<void> {
    const fileSize = (await fs.stat(entry.localPath)).size;

    if (fileSize > this.config.chunkSizeMb * 1024 * 1024) {
      return this.uploadFileResumable(entry, folderId);
    }

    const fileStream = fs.createReadStream(entry.localPath);

    await this.drive.files.create(
      {
        requestBody: {
          name: entry.fileName,
          parents: [folderId],
          mimeType: entry.mimeType,
        },
        media: {
          body: fileStream,
          mimeType: entry.mimeType,
        },
      },
      { timeout: this.config.timeoutMs }
    );

    this.logger.debug(`Uploaded ${entry.fileName}`);
  }

  private async uploadFileResumable(
    entry: { fileName: string; localPath: string; mimeType: string },
    folderId: string
  ): Promise<void> {
    const fileSize = (await fs.stat(entry.localPath)).size;
    const fileStream = fs.createReadStream(entry.localPath, {
      highWaterMark: this.config.chunkSizeMb * 1024 * 1024,
    });

    await this.drive.files.create(
      {
        requestBody: {
          name: entry.fileName,
          parents: [folderId],
        },
        media: {
          body: fileStream,
        },
      },
      {
        timeout: this.config.timeoutMs,
        onUploadProgress: (evt: any) => {
          const progress = Math.round((evt.bytesRead / fileSize) * 100);
          this.logger.debug(`Upload progress: ${entry.fileName} ${progress}%`);
        },
      }
    );

    this.logger.debug(`Uploaded ${entry.fileName} (resumable)`);
  }

  private isRetryableError(err: any): boolean {
    const message = err.message || '';
    return (
      message.includes('ECONNREFUSED') ||
      message.includes('503') ||
      message.includes('429') ||
      message.includes('ETIMEDOUT')
    );
  }
}
