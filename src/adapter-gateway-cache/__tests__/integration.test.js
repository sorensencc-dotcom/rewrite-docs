import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AdapterGateway } from "../gateway/adapter-gateway";
import { MAARRoutingHook } from "../integration/maal-routing-hook";
import { ProviderAdapterHook } from "../integration/provider-adapter-hook";
import { CachePolicy } from "../gateway/cache-policy";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
describe("Integration Tests", () => {
    let gateway;
    let tempDir;
    let mockRouter;
    let mockAdapters;
    beforeEach(async () => {
        tempDir = path.join(os.tmpdir(), `integration-test-${Date.now()}`);
        gateway = new AdapterGateway({
            l1MaxEntries: 50,
            l2DiskDir: tempDir,
            defaultTTLMs: 3600000,
            enableMetrics: true,
        });
        await gateway.initialize();
        mockRouter = {
            invoke: async (adapterId, payload) => {
                throw new Error("Not wrapped yet");
            },
        };
        mockAdapters = {
            "analytics-adapter": {
                id: "analytics-adapter",
                run: async (payload) => ({
                    event: payload.event,
                    timestamp: Date.now(),
                }),
            },
            "data-adapter": {
                id: "data-adapter",
                run: async (payload) => ({
                    data: payload.query,
                    rows: Math.floor(Math.random() * 100),
                }),
            },
            "transform-adapter": {
                id: "transform-adapter",
                run: async (payload) => ({
                    transformed: payload.input.toUpperCase(),
                }),
            },
        };
    });
    afterEach(async () => {
        await gateway.shutdown();
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch { }
    });
    describe("MAAL Router Integration", () => {
        it("should wrap MAAL router with gateway", async () => {
            for (const [id, adapter] of Object.entries(mockAdapters)) {
                gateway.registerAdapter(id, adapter);
            }
            const hook = new MAARRoutingHook(gateway);
            hook.attachToMAARRouter(mockRouter);
            const result = await mockRouter.invoke("analytics-adapter", {
                event: "click",
            });
            expect(result.event).toBe("click");
        });
        it("should expose metrics through wrapped router", async () => {
            gateway.registerAdapter("data-adapter", mockAdapters["data-adapter"]);
            const hook = new MAARRoutingHook(gateway);
            hook.attachToMAARRouter(mockRouter);
            await mockRouter.invoke("data-adapter", { query: "SELECT *" });
            const metrics = mockRouter.getCacheMetrics();
            expect(metrics).toBeDefined();
            expect(metrics.providerHits).toBe(1);
        });
        it("should support offline mode through wrapped router", async () => {
            gateway.registerAdapter("data-adapter", mockAdapters["data-adapter"]);
            const hook = new MAARRoutingHook(gateway);
            hook.attachToMAARRouter(mockRouter);
            await mockRouter.invoke("data-adapter", { query: "SELECT *" });
            mockRouter.setOfflineMode(true);
            const status = mockRouter.getOfflineStatus();
            expect(status.isOffline).toBe(true);
        });
        it("should cache results through wrapped router", async () => {
            gateway.registerAdapter("analytics-adapter", mockAdapters["analytics-adapter"]);
            const hook = new MAARRoutingHook(gateway);
            hook.attachToMAARRouter(mockRouter);
            const r1 = await mockRouter.invokeWithMetrics("analytics-adapter", {
                event: "click",
            });
            const r2 = await mockRouter.invokeWithMetrics("analytics-adapter", {
                event: "click",
            });
            expect(r1.source).toBe("provider");
            expect(r2.source).toBe("l1");
        });
    });
    describe("Provider Adapter Registration", () => {
        it("should register batch adapters", async () => {
            const hook = new ProviderAdapterHook(gateway);
            const adapters = [
                { id: "analytics-adapter", instance: mockAdapters["analytics-adapter"] },
                { id: "data-adapter", instance: mockAdapters["data-adapter"] },
                { id: "transform-adapter", instance: mockAdapters["transform-adapter"] },
            ];
            await hook.registerBatchAdapters(adapters);
            expect(hook.getRegisteredAdapters()).toEqual([
                "analytics-adapter",
                "data-adapter",
                "transform-adapter",
            ]);
        });
        it("should set policies per adapter", async () => {
            const hook = new ProviderAdapterHook(gateway);
            hook.registerProviderAdapter("analytics-adapter", mockAdapters["analytics-adapter"], CachePolicy.ALWAYS);
            expect(hook.isAdapterRegistered("analytics-adapter")).toBe(true);
        });
        it("should set invalidation patterns", async () => {
            const hook = new ProviderAdapterHook(gateway);
            hook.registerProviderAdapter("data-adapter", mockAdapters["data-adapter"]);
            hook.setInvalidationPatterns("data-adapter", ["query:.*", "user:.*"]);
            expect(hook.isAdapterRegistered("data-adapter")).toBe(true);
        });
    });
    describe("Multi-Adapter Flow", () => {
        it("should coordinate caching across multiple adapters", async () => {
            for (const [id, adapter] of Object.entries(mockAdapters)) {
                gateway.registerAdapter(id, adapter);
            }
            const r1 = await gateway.invoke("analytics-adapter", { event: "click" });
            const r2 = await gateway.invoke("data-adapter", { query: "SELECT *" });
            const r3 = await gateway.invoke("transform-adapter", { input: "hello" });
            expect(r1.source).toBe("provider");
            expect(r2.source).toBe("provider");
            expect(r3.source).toBe("provider");
            const r1Cache = await gateway.invoke("analytics-adapter", { event: "click" });
            const r2Cache = await gateway.invoke("data-adapter", { query: "SELECT *" });
            const r3Cache = await gateway.invoke("transform-adapter", { input: "hello" });
            expect(r1Cache.source).toBe("l1");
            expect(r2Cache.source).toBe("l1");
            expect(r3Cache.source).toBe("l1");
        });
        it("should handle different cache policies per adapter", async () => {
            const policyManager = gateway.policyManager;
            gateway.registerAdapter("analytics-adapter", mockAdapters["analytics-adapter"]);
            gateway.registerAdapter("data-adapter", mockAdapters["data-adapter"]);
            policyManager.setPolicy("analytics-adapter", CachePolicy.ALWAYS);
            const r1 = await gateway.invoke("analytics-adapter", { event: "click" });
            expect(r1.success).toBe(true);
            await gateway.invoke("data-adapter", { query: "SELECT *" });
            policyManager.setPolicy("data-adapter", CachePolicy.READ_ONLY);
            const r2 = await gateway.invoke("data-adapter", { query: "SELECT *" });
            expect(r2.success).toBe(true);
        });
        it("should maintain separate caches per adapter", async () => {
            gateway.registerAdapter("analytics-adapter", mockAdapters["analytics-adapter"]);
            gateway.registerAdapter("data-adapter", mockAdapters["data-adapter"]);
            const r1 = await gateway.invoke("analytics-adapter", { event: "click" });
            const r2 = await gateway.invoke("data-adapter", { query: "SELECT *" });
            expect(r1.success).toBe(true);
            expect(r2.success).toBe(true);
            const invalidated = await gateway.invalidateAdapter("analytics-adapter");
            const analyticsResponse = await gateway.invoke("analytics-adapter", {
                event: "click",
            });
            const dataResponse = await gateway.invoke("data-adapter", {
                query: "SELECT *",
            });
            expect(analyticsResponse.source).toBe("provider");
            expect(["l1", "l2"]).toContain(dataResponse.source);
        });
    });
    describe("Deterministic Behavior", () => {
        it("should produce identical results for identical inputs", async () => {
            gateway.registerAdapter("transform-adapter", mockAdapters["transform-adapter"]);
            const results = [];
            for (let i = 0; i < 5; i++) {
                const response = await gateway.invoke("transform-adapter", {
                    input: "test",
                }, true);
                results.push(response.data);
            }
            const allIdentical = results.every((r) => JSON.stringify(r) === JSON.stringify(results[0]));
            expect(allIdentical).toBe(true);
        });
        it("should maintain determinism across cache sources", async () => {
            gateway.registerAdapter("data-adapter", mockAdapters["data-adapter"]);
            const r1 = await gateway.invoke("data-adapter", { query: "SELECT *" });
            const r2 = await gateway.invoke("data-adapter", { query: "SELECT *" });
            expect(r1.data.data).toBe(r2.data.data);
        });
    });
    describe("Stress Integration", () => {
        it("should handle 1000 concurrent requests across adapters", async () => {
            for (const [id, adapter] of Object.entries(mockAdapters)) {
                gateway.registerAdapter(id, adapter);
            }
            const adapterIds = Object.keys(mockAdapters);
            const requests = Array(1000)
                .fill(null)
                .map((_, i) => {
                const adapterId = adapterIds[i % adapterIds.length];
                const payload = adapterId === "analytics-adapter"
                    ? { event: "click" }
                    : adapterId === "data-adapter"
                        ? { query: "SELECT *" }
                        : { input: "test" };
                return gateway.invoke(adapterId, payload);
            });
            const responses = await Promise.all(requests);
            expect(responses).toHaveLength(1000);
            expect(responses.every((r) => r.success)).toBe(true);
            const metrics = gateway.getMetrics();
            const hitRate = gateway.getHitRate();
            expect(hitRate).toBeGreaterThanOrEqual(0);
            expect(metrics.l1Hits + metrics.l2Hits + metrics.providerHits).toBeGreaterThan(0);
        });
    });
    describe("End-to-End Flow", () => {
        it("should complete full pipeline: register → invoke → cache → metrics", async () => {
            const hook = new ProviderAdapterHook(gateway);
            await hook.registerBatchAdapters([
                { id: "step1", instance: mockAdapters["analytics-adapter"] },
                { id: "step2", instance: mockAdapters["data-adapter"] },
            ]);
            const r1 = await gateway.invoke("step1", { event: "start" });
            expect(r1.source).toBe("provider");
            const r2 = await gateway.invoke("step2", {
                query: r1.data.event,
            });
            expect(r2.source).toBe("provider");
            const metrics = gateway.getMetrics();
            expect(metrics.providerHits).toBe(2);
            const r1Cache = await gateway.invoke("step1", { event: "start" });
            expect(r1Cache.source).toBe("l1");
            const finalMetrics = gateway.getMetrics();
            expect(finalMetrics.l1Hits).toBe(1);
        });
    });
});
//# sourceMappingURL=integration.test.js.map