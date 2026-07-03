import { DaemonConfig } from './config';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateConfig(config: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Mailpit config
  if (!config.mailpit) {
    errors.push({ field: 'mailpit', message: 'mailpit config is required' });
  } else {
    if (!config.mailpit.baseUrl) {
      errors.push({ field: 'mailpit.baseUrl', message: 'baseUrl is required' });
    }
    if (typeof config.mailpit.pollIntervalMs !== 'number' || config.mailpit.pollIntervalMs < 1000) {
      errors.push({ field: 'mailpit.pollIntervalMs', message: 'must be >= 1000' });
    }
    if (typeof config.mailpit.maxMessagesPerPoll !== 'number' || config.mailpit.maxMessagesPerPoll < 1) {
      errors.push({ field: 'mailpit.maxMessagesPerPoll', message: 'must be >= 1' });
    }
  }

  // Validation config
  if (!config.validation) {
    errors.push({ field: 'validation', message: 'validation config is required' });
  } else {
    if (!config.validation.stagingRoot) {
      errors.push({ field: 'validation.stagingRoot', message: 'stagingRoot is required' });
    }
    if (typeof config.validation.maxAttachmentSizeMb !== 'number') {
      errors.push({ field: 'validation.maxAttachmentSizeMb', message: 'must be a number' });
    }
    if (typeof config.validation.maxTotalSizeMb !== 'number') {
      errors.push({ field: 'validation.maxTotalSizeMb', message: 'must be a number' });
    }
    if (!Array.isArray(config.validation.blockedMimeTypes)) {
      errors.push({ field: 'validation.blockedMimeTypes', message: 'must be an array' });
    }
    if (!Array.isArray(config.validation.blockedFilePatterns)) {
      errors.push({ field: 'validation.blockedFilePatterns', message: 'must be an array' });
    }
  }

  // Classification config
  if (!config.classification) {
    errors.push({ field: 'classification', message: 'classification config is required' });
  } else {
    if (!Array.isArray(config.classification.tier1Patterns)) {
      errors.push({ field: 'classification.tier1Patterns', message: 'must be an array' });
    }
    if (!Array.isArray(config.classification.tier2Patterns)) {
      errors.push({ field: 'classification.tier2Patterns', message: 'must be an array' });
    }
    if (!Array.isArray(config.classification.tier3Patterns)) {
      errors.push({ field: 'classification.tier3Patterns', message: 'must be an array' });
    }
  }

  // Watcher config
  if (!config.watcher) {
    errors.push({ field: 'watcher', message: 'watcher config is required' });
  } else {
    if (!config.watcher.watchDir) {
      errors.push({ field: 'watcher.watchDir', message: 'watchDir is required' });
    }
    if (typeof config.watcher.debounceMs !== 'number') {
      errors.push({ field: 'watcher.debounceMs', message: 'must be a number' });
    }
  }

  // Routing config
  if (!config.routing) {
    errors.push({ field: 'routing', message: 'routing config is required' });
  } else {
    validateTierRoute(config.routing.tier1, 'routing.tier1', errors);
    validateTierRoute(config.routing.tier2, 'routing.tier2', errors);
    validateTierRoute(config.routing.tier3, 'routing.tier3', errors);
  }

  // Drive config
  if (!config.drive) {
    errors.push({ field: 'drive', message: 'drive config is required' });
  } else {
    if (!config.drive.clientId) {
      errors.push({ field: 'drive.clientId', message: 'clientId is required (or set via env var)' });
    }
    if (!config.drive.clientSecret) {
      errors.push({ field: 'drive.clientSecret', message: 'clientSecret is required (or set via env var)' });
    }
    if (!config.drive.refreshToken) {
      errors.push({ field: 'drive.refreshToken', message: 'refreshToken is required (or set via env var)' });
    }
    if (typeof config.drive.maxConcurrentUploads !== 'number' || config.drive.maxConcurrentUploads < 1) {
      errors.push({ field: 'drive.maxConcurrentUploads', message: 'must be >= 1' });
    }
  }

  return errors;
}

function validateTierRoute(route: any, path: string, errors: ValidationError[]): void {
  if (!route) {
    errors.push({ field: path, message: 'tier route is required' });
    return;
  }

  if (!route.destination) {
    errors.push({ field: `${path}.destination`, message: 'destination is required' });
  }
  if (!route.uploadMethod) {
    errors.push({ field: `${path}.uploadMethod`, message: 'uploadMethod is required' });
  }
  if (!['drive-api', 'rclone', 'local-copy'].includes(route.uploadMethod)) {
    errors.push({
      field: `${path}.uploadMethod`,
      message: 'must be one of: drive-api, rclone, local-copy',
    });
  }
}
