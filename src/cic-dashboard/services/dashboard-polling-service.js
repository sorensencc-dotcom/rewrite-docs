/**
 * Dashboard Polling Service
 * Manages periodic polling of all dashboard nodes including RL Vault.
 */
import { adapterLogger } from "../../logging/adapterLogger";
import { pollRLVault } from "../nodes/rl-vault-node";
class DashboardPollingService {
    nodes = new Map();
    pollingInterval;
    intervalHandle = null;
    lastResults = new Map();
    constructor(pollingInterval = 30000) {
        // Poll every 30 seconds by default
        this.pollingInterval = pollingInterval;
        this.registerDefaultNodes();
    }
    /**
     * Register default dashboard nodes.
     */
    registerDefaultNodes() {
        this.registerNode({
            id: "RL-VAULT",
            poll: pollRLVault,
        });
    }
    /**
     * Register a custom dashboard node.
     */
    registerNode(node) {
        this.nodes.set(node.id, node);
        adapterLogger.debug({
            service: "dashboard-polling",
            message: `Registered node: ${node.id}`,
        });
    }
    /**
     * Start polling loop.
     */
    start() {
        if (this.intervalHandle) {
            adapterLogger.warn({
                service: "dashboard-polling",
                message: "Polling already active",
            });
            return;
        }
        adapterLogger.info({
            service: "dashboard-polling",
            message: `Starting polling loop (interval: ${this.pollingInterval}ms, nodes: ${this.nodes.size})`,
        });
        this.intervalHandle = setInterval(() => {
            this.pollAllNodes().catch(err => {
                adapterLogger.error({
                    service: "dashboard-polling",
                    error: err,
                });
            });
        }, this.pollingInterval);
        // Initial poll on start
        this.pollAllNodes().catch(err => {
            adapterLogger.error({
                service: "dashboard-polling",
                message: "Initial poll failed",
                error: err,
            });
        });
    }
    /**
     * Stop polling loop.
     */
    stop() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
            adapterLogger.info({
                service: "dashboard-polling",
                message: "Polling stopped",
            });
        }
    }
    /**
     * Poll all registered nodes.
     */
    async pollAllNodes() {
        const results = new Map();
        const promises = Array.from(this.nodes.entries()).map(async ([id, node]) => {
            try {
                const data = await node.poll();
                results.set(id, { success: true, data, timestamp: Date.now() });
                this.lastResults.set(id, data);
            }
            catch (err) {
                adapterLogger.error({
                    service: "dashboard-polling",
                    node: id,
                    error: err,
                });
                results.set(id, { success: false, error: String(err), timestamp: Date.now() });
            }
        });
        await Promise.allSettled(promises);
        return results;
    }
    /**
     * Get last polling result for a node.
     */
    getLastResult(nodeId) {
        return this.lastResults.get(nodeId);
    }
    /**
     * Get all last results.
     */
    getAllLastResults() {
        return new Map(this.lastResults);
    }
    /**
     * Get polling status.
     */
    getStatus() {
        return {
            isActive: this.intervalHandle !== null,
            pollingInterval: this.pollingInterval,
            registeredNodes: Array.from(this.nodes.keys()),
            lastResults: Object.fromEntries(this.lastResults),
        };
    }
}
export const dashboardPollingService = new DashboardPollingService();
//# sourceMappingURL=dashboard-polling-service.js.map