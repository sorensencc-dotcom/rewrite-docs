"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor(context) {
        this.context = context;
    }
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const dataStr = data ? ` ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level}] [${this.context}] ${message}${dataStr}`;
    }
    debug(message, data) {
        console.log(this.formatMessage('DEBUG', message, data));
    }
    info(message, data) {
        console.log(this.formatMessage('INFO', message, data));
    }
    warn(message, data) {
        console.warn(this.formatMessage('WARN', message, data));
    }
    error(message, data) {
        console.error(this.formatMessage('ERROR', message, data));
    }
}
exports.Logger = Logger;
