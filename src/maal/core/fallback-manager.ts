export class FallbackManager {
  static async executeWithFallback(primaryAction: () => Promise<any>, fallbackAction: () => Promise<any>) {
    try {
      return await primaryAction();
    } catch (e) {
      console.warn('[FallbackManager] Primary action failed, triggering fallback.', e);
      return await fallbackAction();
    }
  }
}
