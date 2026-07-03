import fs from 'fs-extra';
import path from 'path';
import { MailpitMessage, MailpitAttachment, MailpitClient } from '../client/MailpitClient';
import { Logger } from '../utils/Logger';
import { sanitizeFilename } from '../utils/sanitize';

export interface ValidationConfig {
  requireAttachments: boolean;
  maxAttachments: number;
  maxTotalSizeMb: number;
  maxAttachmentSizeMb: number;
  blockedMimeTypes: string[];
  blockedFilePatterns: string[];
  stagingRoot: string;
}

export interface ClassificationConfig {
  tier1Patterns: string[];
  tier2Patterns: string[];
  tier3Patterns: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExtractedAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
  extractedAt: string;
  extractionStatus: 'success' | 'failed' | 'timeout';
  tier?: string;
  confidence?: number;
}

export interface Batch {
  batchId: string;
  batchDir: string;
  manifest: BatchManifest;
}

export interface BatchManifest {
  batch_id: string;
  sender: string;
  recipient: string;
  subject: string;
  body?: string;
  message_date: string;
  created_at: string;
  attachments: ExtractedAttachment[];
  validation: ValidationResult;
  classification: {
    primary_tier: string;
    confidence: number;
    reasoning: string;
    flagged: boolean;
    requires_manual_review: boolean;
  };
  ingest_status: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    started_at?: string;
    completed_at?: string;
    error?: string;
  };
}

export class BatchProcessor {
  private validationConfig: ValidationConfig;
  private classificationConfig: ClassificationConfig;
  private logger: Logger;
  private mailpitClient: MailpitClient;
  private blockedPatterns: RegExp[];

  constructor(
    validationConfig: ValidationConfig,
    classificationConfig: ClassificationConfig,
    mailpitClient: MailpitClient
  ) {
    if (!mailpitClient) {
      throw new Error('MailpitClient is required');
    }
    this.validationConfig = validationConfig;
    this.classificationConfig = classificationConfig;
    this.logger = new Logger('BatchProcessor');
    this.blockedPatterns = validationConfig.blockedFilePatterns.map((p) => new RegExp(p));
    this.mailpitClient = mailpitClient;
  }

  async processMessage(msg: MailpitMessage): Promise<Batch> {
    const batchId = this.generateBatchId(msg.id, msg.date);
    const batchDir = path.join(this.validationConfig.stagingRoot, 'pending', batchId);

    this.logger.info(`Processing message ${msg.id} -> batch ${batchId}`);

    // Pre-flight validation
    const validation = this.validateMessage(msg);
    if (!validation.valid) {
      await this.handleValidationFailure(batchId, msg, validation);
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    // Create batch directory
    await fs.mkdir(batchDir, { recursive: true });

    // Extract attachments
    const extractedFiles = await this.extractAttachments(msg, batchDir);

    // Classify
    const classification = this.classifyBatch(msg, extractedFiles);

    // Build manifest
    const manifest: BatchManifest = {
      batch_id: batchId,
      sender: msg.from.address,
      recipient: msg.to[0]?.address || 'unknown',
      subject: msg.subject,
      body: msg.text,
      message_date: msg.date,
      created_at: new Date().toISOString(),
      attachments: extractedFiles,
      validation,
      classification,
      ingest_status: {
        status: 'pending',
      },
    };

    // Write manifest
    await fs.writeFile(
      path.join(batchDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Write intake log
    await this.appendIntakeLog(batchDir, {
      timestamp: new Date().toISOString(),
      event: 'batch_created',
      batchId,
      attachmentCount: extractedFiles.length,
    });

    this.logger.info(`Batch ${batchId} created with ${extractedFiles.length} files`);

    return { batchId, batchDir, manifest };
  }

  private validateMessage(msg: MailpitMessage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.validationConfig.requireAttachments && msg.attachments.length === 0) {
      errors.push('No attachments found');
    }

    if (msg.attachments.length > this.validationConfig.maxAttachments) {
      errors.push(`Exceeds max attachments (${this.validationConfig.maxAttachments})`);
    }

    const totalSize = msg.attachments.reduce((sum, att) => sum + att.size, 0);
    if (totalSize > this.validationConfig.maxTotalSizeMb * 1024 * 1024) {
      errors.push(`Exceeds total size limit (${this.validationConfig.maxTotalSizeMb}MB)`);
    }

    for (const att of msg.attachments) {
      if (this.validationConfig.blockedMimeTypes.includes(att.mimeType)) {
        errors.push(`Attachment ${att.fileName} has blocked MIME type: ${att.mimeType}`);
      }

      for (const pattern of this.blockedPatterns) {
        if (pattern.test(att.fileName)) {
          errors.push(`Attachment ${att.fileName} matches blocked pattern`);
        }
      }

      if (att.size === 0) {
        warnings.push(`Attachment ${att.fileName} is zero-byte`);
      }

      if (att.size > this.validationConfig.maxAttachmentSizeMb * 1024 * 1024) {
        warnings.push(`Attachment ${att.fileName} exceeds recommended size`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async extractAttachments(
    msg: MailpitMessage,
    batchDir: string
  ): Promise<ExtractedAttachment[]> {
    const results: ExtractedAttachment[] = [];

    for (const att of msg.attachments) {
      try {
        const extracted = await this.extractAttachmentWithTimeout(msg.id, att, batchDir, 15000);
        results.push(extracted);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to extract attachment ${att.fileName}: ${errorMsg}`);
        results.push({
          fileName: att.fileName,
          mimeType: att.mimeType,
          sizeBytes: att.size,
          path: '',
          extractedAt: new Date().toISOString(),
          extractionStatus: 'failed',
        });
      }
    }

    return results;
  }

  private async extractAttachmentWithTimeout(
    messageId: string,
    att: MailpitAttachment,
    batchDir: string,
    timeoutMs: number
  ): Promise<ExtractedAttachment> {
    return Promise.race([
      this.extractAttachment(messageId, att, batchDir),
      new Promise<ExtractedAttachment>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Extraction timeout: ${att.fileName}`)),
          timeoutMs
        )
      ),
    ]);
  }

  private async extractAttachment(
    messageId: string,
    att: MailpitAttachment,
    batchDir: string
  ): Promise<ExtractedAttachment> {
    const filename = sanitizeFilename(att.fileName);
    const attPath = path.join(batchDir, filename);

    // Download via Mailpit API
    const buffer = await this.mailpitClient.downloadAttachment(messageId, att.partID);

    if (buffer.byteLength > this.validationConfig.maxAttachmentSizeMb * 1024 * 1024) {
      throw new Error(`Attachment exceeds size limit: ${att.fileName}`);
    }

    await fs.writeFile(attPath, buffer);

    return {
      fileName: filename,
      mimeType: att.mimeType,
      sizeBytes: buffer.byteLength,
      path: attPath,
      extractedAt: new Date().toISOString(),
      extractionStatus: 'success',
    };
  }

  private classifyBatch(msg: MailpitMessage, files: ExtractedAttachment[]): BatchManifest['classification'] {
    const fileExts = files.map((f) => path.extname(f.fileName).toLowerCase());

    // Simple heuristic: check file extensions against tier patterns
    const tier1Count = fileExts.filter((ext) =>
      this.classificationConfig.tier1Patterns.some((p) => new RegExp(p).test(ext))
    ).length;

    const tier2Count = fileExts.filter((ext) =>
      this.classificationConfig.tier2Patterns.some((p) => new RegExp(p).test(ext))
    ).length;

    let primaryTier = 'tier-3';
    let confidence = 0.5;
    let reasoning = 'Default tier-3 assignment';

    if (tier1Count > tier2Count && tier1Count > 0) {
      primaryTier = 'tier-1';
      confidence = Math.min(0.95, 0.5 + tier1Count * 0.1);
      reasoning = `${tier1Count} tier-1 files detected`;
    } else if (tier2Count > tier1Count && tier2Count > 0) {
      primaryTier = 'tier-2';
      confidence = Math.min(0.95, 0.5 + tier2Count * 0.1);
      reasoning = `${tier2Count} tier-2 files detected`;
    } else if (tier1Count > 0 || tier2Count > 0) {
      primaryTier = tier1Count > 0 ? 'tier-1' : 'tier-2';
      confidence = 0.6;
      reasoning = 'Mixed tier files detected';
    }

    const requiresManualReview = confidence < 0.7 || (tier1Count > 0 && tier2Count > 0);

    return {
      primary_tier: primaryTier,
      confidence,
      reasoning,
      flagged: requiresManualReview,
      requires_manual_review: requiresManualReview,
    };
  }

  private async handleValidationFailure(
    batchId: string,
    msg: MailpitMessage,
    validation: ValidationResult
  ): Promise<void> {
    const rejectedDir = path.join(this.validationConfig.stagingRoot, 'rejected', batchId);
    await fs.mkdir(rejectedDir, { recursive: true });

    const rejection = {
      batch_id: batchId,
      sender: msg.from.address,
      subject: msg.subject,
      errors: validation.errors,
      warnings: validation.warnings,
      rejected_at: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(rejectedDir, 'rejection.json'),
      JSON.stringify(rejection, null, 2)
    );

    await this.appendIntakeLog(rejectedDir, {
      timestamp: new Date().toISOString(),
      event: 'validation_failed',
      batchId,
      errors: validation.errors,
    });

    this.logger.warn(`Batch ${batchId} validation failed, moved to rejected/`);
  }

  private async appendIntakeLog(batchDir: string, entry: any): Promise<void> {
    const logPath = path.join(batchDir, 'intake.log');
    const logLine = JSON.stringify(entry) + '\n';
    await fs.appendFile(logPath, logLine);
  }

  private generateBatchId(messageId: string, date: string): string {
    const timestamp = new Date(date).getTime();
    const hash = messageId.substring(0, 8).replace(/[^a-z0-9]/gi, '');
    return `batch-${timestamp}-${hash}`;
  }
}
