/**
 * PHASE 27.3 — Metrics HTTP Server
 * Exposes Prometheus metrics endpoint at /metrics
 * Used by Prometheus scraper (every 5s)
 */
import { Express } from 'express';
export declare class MetricsServer {
    private app;
    private logger;
    private port;
    constructor(port?: number);
    private setupRoutes;
    start(): Promise<void>;
    getApp(): Express;
}
//# sourceMappingURL=MetricsServer.d.ts.map