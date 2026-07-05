/**
 * Structured logger for CIC observability
 * Stub implementation for Phase 2
 */
class CICLogger {
    info(event, context) {
        console.log(JSON.stringify({ level: "INFO", event, ...context }));
    }
    warn(event, context) {
        console.warn(JSON.stringify({ level: "WARN", event, ...context }));
    }
    error(event, context) {
        console.error(JSON.stringify({ level: "ERROR", event, ...context }));
    }
    debug(event, context) {
        if (process.env.DEBUG) {
            console.debug(JSON.stringify({ level: "DEBUG", event, ...context }));
        }
    }
}
export const logger = new CICLogger();
//# sourceMappingURL=logger.js.map