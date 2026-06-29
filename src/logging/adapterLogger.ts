// src/logging/adapterLogger.ts
import { adapterLogger as baseLogger } from '../metrics/AdapterLogger.js';

type SinkFn = (entry: any) => void;
let currentSink: SinkFn | null = null;

export const adapterLogger = {
  _setSink(sink: SinkFn | null) {
    currentSink = sink;
  },

  info(entry: any) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level: 'info', ...entry };
    if (currentSink) {
      currentSink(logEntry);
    }
    baseLogger.info({
      component: entry.adapter || 'unknown',
      action: entry.operation || 'call',
      status: 'success',
      meta: entry
    });
  },

  error(entry: any) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level: 'error', ...entry };
    if (entry.error && entry.error instanceof Error) {
      logEntry.error = {
        message: entry.error.message,
        stack: entry.error.stack
      };
    }
    if (currentSink) {
      currentSink(logEntry);
    }
    baseLogger.error({
      component: entry.adapter || 'unknown',
      action: entry.operation || 'call',
      status: 'error',
      errorCode: entry.error?.code || 'ERROR',
      errorDetails: entry.error ? { message: entry.error.message, stack: entry.error.stack } : undefined,
      meta: entry
    });
  }
};
