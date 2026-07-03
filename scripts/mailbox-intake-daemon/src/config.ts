import fs from 'fs-extra';
import path from 'path';
import { validateConfig } from './config-validator';

export interface DaemonConfig {
  mailpit: {
    baseUrl: string;
    timeout_ms: number;
    maxConnections: number;
    maxRetries: number;
    retryBackoffMs: number;
    healthCheckIntervalMs: number;
    circuitBreakerThreshold: number;
    circuitBreakerResetMs: number;
    pollIntervalMs: number;
    maxMessagesPerPoll: number;
  };
  validation: {
    requireAttachments: boolean;
    maxAttachments: number;
    maxTotalSizeMb: number;
    maxAttachmentSizeMb: number;
    blockedMimeTypes: string[];
    blockedFilePatterns: string[];
    stagingRoot: string;
  };
  classification: {
    tier1Patterns: string[];
    tier2Patterns: string[];
    tier3Patterns: string[];
  };
  watcher: {
    watchDir: string;
    debounceMs: number;
    enablePolling: boolean;
    pollingIntervalMs: number;
    ignorePatterns: string[];
  };
  routing: {
    tier1: any;
    tier2: any;
    tier3: any;
    unmappedTier: any;
  };
  drive: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    maxConcurrentUploads: number;
    chunkSizeMb: number;
    timeoutMs: number;
  };
  monitoring: {
    checkStuckIntervalMinutes: number;
    stuckThresholdMinutes: number;
    archiveRotationDays: number;
  };
}

export function loadConfig(): DaemonConfig {
  const configPath = process.env.CONFIG_PATH || './config.json';

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  let config: any;
  try {
    config = fs.readJsonSync(configPath);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse config JSON: ${errorMsg}`);
  }

  // Validate schema
  const errors = validateConfig(config);
  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `  ${e.field}: ${e.message}`).join('\n');
    throw new Error(`Config validation failed:\n${errorMessages}`);
  }

  // Apply environment variable overrides for sensitive fields
  if (process.env.DRIVE_CLIENT_ID) {
    config.drive.clientId = process.env.DRIVE_CLIENT_ID;
  }
  if (process.env.DRIVE_CLIENT_SECRET) {
    config.drive.clientSecret = process.env.DRIVE_CLIENT_SECRET;
  }
  if (process.env.DRIVE_REFRESH_TOKEN) {
    config.drive.refreshToken = process.env.DRIVE_REFRESH_TOKEN;
  }

  return config as DaemonConfig;
}
