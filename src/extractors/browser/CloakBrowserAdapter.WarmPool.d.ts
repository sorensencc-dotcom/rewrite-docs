/**
 * CloakBrowserAdapter with WarmPool integration.
 * Manages session lifecycle: checkout → navigate → recordMetrics → checkin
 */
export declare class CloakBrowserAdapterWithWarmPool {
    private warmPool;
    private hydrationDetector;
    private domSampler;
    constructor(warmPoolSize?: number);
    init(): Promise<void>;
    /**
     * Navigate to URL using warm pool session
     */
    navigate(url: string, options?: {
        retryCount?: number;
        timeoutMs?: number;
    }): Promise<{
        dom: string;
        hydrationScore: number;
        latencyMs: number;
        screenshot: Buffer;
    }>;
    /**
     * Sample multiple URLs and select best DOM
     */
    sampleUrls(baseUrl: string): Promise<{
        selectedUrl: string;
        completenessScore: number;
        dom: string;
    }>;
    /**
     * Get warm pool metrics
     */
    getWarmPoolMetrics(): import("./WarmPoolManager").WarmPoolMetrics;
    /**
     * Drain warm pool and cleanup
     */
    cleanup(): Promise<void>;
}
/**
 * Factory function for testing
 */
export declare function createAdapterWithWarmPool(warmPoolSize?: number): CloakBrowserAdapterWithWarmPool;
//# sourceMappingURL=CloakBrowserAdapter.WarmPool.d.ts.map