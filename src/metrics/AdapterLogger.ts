/**
 * PHASE 27.3 — Adapter Structured Logger
 * JSON format for observability stack integration
 * Emits to stdout for collection by Prometheus/ELK
 */

import pino from 'pino';

export interface AdapterLogContext {
  timestamp?: string;
  level: 'info' | 'warn' | 'error';
  component: string;
  adapter?: string;
  action: 'call' | 'validate' | 'guard' | 'envelope';
  status: 'success' | 'error';
  durationMs?: number;
  errorCode?: string;
  errorDetails?: Record<string, unknown>;
  meta?: {
    adapter?: string;
    timestamp?: string;
    durationMs?: number;
  };
}

class AdapterLoggerImpl {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  info(context: Omit<AdapterLogContext, 'level'>): void {
    this.logger.info({ ...context, level: 'info' });
  }

  warn(context: Omit<AdapterLogContext, 'level'>): void {
    this.logger.warn({ ...context, level: 'warn' });
  }

  error(context: Omit<AdapterLogContext, 'level'>): void {
    this.logger.error({ ...context, level: 'error' });
  }

  debug(context: Omit<AdapterLogContext, 'level'>): void {
    this.logger.debug({ ...context, level: 'debug' });
  }
}

export const adapterLogger = new AdapterLoggerImpl();
