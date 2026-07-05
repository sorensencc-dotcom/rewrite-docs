/**
 * Envelope helpers for standardized adapter responses
 * All adapters wrap output with success/error structure
 */
export function makeSuccess(data, adapter, startTime) {
    return {
        ok: true,
        data,
        meta: {
            adapter,
            durationMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        },
    };
}
export function makeError(code, details, adapter, startTime) {
    return {
        ok: false,
        error: {
            code,
            message: code,
            details,
        },
        meta: {
            adapter,
            durationMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        },
    };
}
//# sourceMappingURL=envelope.js.map