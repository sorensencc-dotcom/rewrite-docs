// src/logging/adapterLogger.ts
import { adapterLogger as baseLogger } from '../metrics/AdapterLogger.js';
let currentSink = null;
export const adapterLogger = {
    _setSink(sink) {
        currentSink = sink;
    },
    info(entry) {
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
    warn(entry) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level: 'warn', ...entry };
        if (currentSink) {
            currentSink(logEntry);
        }
        baseLogger.warn({
            component: entry.adapter || 'unknown',
            action: entry.operation || 'call',
            status: 'success',
            meta: entry
        });
    },
    debug(entry) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level: 'debug', ...entry };
        if (currentSink) {
            currentSink(logEntry);
        }
        baseLogger.debug({
            component: entry.adapter || 'unknown',
            action: entry.operation || 'call',
            status: 'success',
            meta: entry
        });
    },
    error(entry) {
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
//# sourceMappingURL=adapterLogger.js.map