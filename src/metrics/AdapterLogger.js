/**
 * PHASE 27.3 — Adapter Structured Logger
 * JSON format for observability stack integration
 * Emits to stdout for collection by Prometheus/ELK
 */
import pino from 'pino';
class AdapterLoggerImpl {
    logger;
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
    info(context) {
        this.logger.info({ ...context, level: 'info' });
    }
    warn(context) {
        this.logger.warn({ ...context, level: 'warn' });
    }
    error(context) {
        this.logger.error({ ...context, level: 'error' });
    }
    debug(context) {
        this.logger.debug({ ...context, level: 'debug' });
    }
}
export const adapterLogger = new AdapterLoggerImpl();
//# sourceMappingURL=AdapterLogger.js.map