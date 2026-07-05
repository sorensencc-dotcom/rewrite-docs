export class MaalLogger {
    static log(level, message, context) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] [${level}] ${message}`, context || '');
    }
}
//# sourceMappingURL=maal-logger.js.map