export class FallbackManager {
    static async executeWithFallback(primaryAction, fallbackAction) {
        try {
            return await primaryAction();
        }
        catch (e) {
            console.warn('[FallbackManager] Primary action failed, triggering fallback.', e);
            return await fallbackAction();
        }
    }
}
//# sourceMappingURL=fallback-manager.js.map