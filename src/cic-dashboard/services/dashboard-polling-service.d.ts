/**
 * Dashboard Polling Service
 * Manages periodic polling of all dashboard nodes including RL Vault.
 */
export interface DashboardNodePoller {
    id: string;
    poll: () => Promise<any>;
}
declare class DashboardPollingService {
    private nodes;
    private pollingInterval;
    private intervalHandle;
    private lastResults;
    constructor(pollingInterval?: number);
    /**
     * Register default dashboard nodes.
     */
    private registerDefaultNodes;
    /**
     * Register a custom dashboard node.
     */
    registerNode(node: DashboardNodePoller): void;
    /**
     * Start polling loop.
     */
    start(): void;
    /**
     * Stop polling loop.
     */
    stop(): void;
    /**
     * Poll all registered nodes.
     */
    pollAllNodes(): Promise<Map<string, any>>;
    /**
     * Get last polling result for a node.
     */
    getLastResult(nodeId: string): any;
    /**
     * Get all last results.
     */
    getAllLastResults(): Map<string, any>;
    /**
     * Get polling status.
     */
    getStatus(): {
        isActive: boolean;
        pollingInterval: number;
        registeredNodes: string[];
        lastResults: {
            [k: string]: any;
        };
    };
}
export declare const dashboardPollingService: DashboardPollingService;
export {};
//# sourceMappingURL=dashboard-polling-service.d.ts.map