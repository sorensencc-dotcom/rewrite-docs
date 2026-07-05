export function logEvent(payload) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, ...payload };
    // Log to stderr for structured observability systems to capture
    if (process.env.LOG_LEVEL === "debug") {
        console.error(JSON.stringify(entry));
    }
    // For production, wire into CIC observability layer via environment hook
    if (typeof globalThis !== "undefined" && globalThis.__cicEventBus) {
        try {
            globalThis.__cicEventBus.emit(payload.eventName, entry);
        }
        catch (e) {
            // Silently fail if event bus is not available
        }
    }
}
//# sourceMappingURL=events.js.map