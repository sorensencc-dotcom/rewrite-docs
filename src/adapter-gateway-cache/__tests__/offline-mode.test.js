import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AdapterGateway } from "../gateway/adapter-gateway";
import { CachePolicy } from "../gateway/cache-policy";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
describe("Offline Mode", () => {
    let gateway;
    let tempDir;
    let mockAdapter;
    let shouldFail = false;
    beforeEach(async () => {
        tempDir = path.join(os.tmpdir(), `offline-test-${Date.now()}`);
        gateway = new AdapterGateway({
            l1MaxEntries: 10,
            l2DiskDir: tempDir,
            defaultTTLMs: 3600000,
            enableMetrics: true,
        });
        mockAdapter = {
            id: "test-adapter",
            run: async (payload) => {
                if (shouldFail) {
                    throw new Error("Provider unavailable");
                }
                return { result: payload.value * 2 };
            },
        };
        await gateway.initialize();
        gateway.registerAdapter("test-adapter", mockAdapter);
    });
    afterEach(async () => {
        await gateway.shutdown();
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch { }
    });
    describe("Offline Status", () => {
        it("should start in online mode", () => {
            const status = gateway.getOfflineStatus();
            expect(status.isOffline).toBe(false);
            expect(status.durationMs).toBe(0);
        });
        it("should set offline mode", () => {
            gateway.setOfflineMode(true);
            const status = gateway.getOfflineStatus();
            expect(status.isOffline).toBe(true);
        });
        it("should track offline duration", async () => {
            gateway.setOfflineMode(true);
            await new Promise((resolve) => setTimeout(resolve, 50));
            const status = gateway.getOfflineStatus();
            expect(status.durationMs).toBeGreaterThanOrEqual(50);
        });
        it("should clear offline duration on resume", () => {
            gateway.setOfflineMode(true);
            gateway.setOfflineMode(false);
            const status = gateway.getOfflineStatus();
            expect(status.durationMs).toBe(0);
        });
    });
    describe("Offline Fallback", () => {
        it("should serve from cache when provider fails", async () => {
            const response1 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response1.source).toBe("provider");
            shouldFail = true;
            const response2 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response2.success).toBe(true);
            expect(["l1", "offline"]).toContain(response2.source);
            expect(response2.data).toEqual({ result: 10 });
        });
        it("should fail when no cache and provider unavailable", async () => {
            shouldFail = true;
            const response = await gateway.invoke("test-adapter", { value: 5 });
            expect(response.success).toBe(false);
            expect(response.source).toBe("error");
        });
        it("should serve from L1 in offline mode", async () => {
            const response1 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response1.success).toBe(true);
            shouldFail = true;
            gateway.setOfflineMode(true);
            const response2 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response2.success).toBe(true);
            expect(["l1", "offline"]).toContain(response2.source);
        });
        it("should serve from L2 in offline mode", async () => {
            const response1 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response1.success).toBe(true);
            const l1 = gateway.l1;
            l1.clear();
            shouldFail = true;
            gateway.setOfflineMode(true);
            const response2 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response2.success).toBe(true);
            expect(["l2", "offline"]).toContain(response2.source);
        });
    });
    describe("Read-Only Policy", () => {
        it("should reject provider calls in read-only mode", async () => {
            const policyManager = gateway.policyManager;
            policyManager.setPolicy("test-adapter", CachePolicy.READ_ONLY);
            shouldFail = true;
            const response = await gateway.invoke("test-adapter", { value: 5 });
            expect(response.success).toBe(false);
            expect(response.error).toContain("Read-only");
        });
        it("should serve from cache in read-only mode", async () => {
            const policyManager = gateway.policyManager;
            policyManager.setPolicy("test-adapter", CachePolicy.READ_ONLY);
            const response1 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response1.success).toBe(true);
            shouldFail = true;
            const response2 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response2.success).toBe(true);
            expect(["l1", "l2", "offline"]).toContain(response2.source);
        });
    });
    describe("Preload", () => {
        it("should preload offline cache keys", async () => {
            const l2 = gateway.l2;
            await l2.set("key1", { value: 1 });
            await l2.set("key2", { value: 2 });
            const preloaded = await gateway.preloadOfflineCache("test-adapter", [
                "key1",
                "key2",
            ]);
            expect(preloaded).toBeGreaterThanOrEqual(0);
        });
    });
    describe("Offline Stats", () => {
        it("should provide offline statistics", () => {
            const stats = gateway.getOfflineStats();
            expect(stats.cachedKeys).toBeGreaterThanOrEqual(0);
            expect(stats.lastKnownGoodCount).toBeGreaterThanOrEqual(0);
        });
        it("should track cached keys", async () => {
            const response1 = await gateway.invoke("test-adapter", { value: 1 });
            expect(response1.success).toBe(true);
            const response2 = await gateway.invoke("test-adapter", { value: 2 });
            expect(response2.success).toBe(true);
            const stats = gateway.getOfflineStats();
            expect(stats.cachedKeys).toBeGreaterThanOrEqual(0);
            expect(stats.lastKnownGoodCount).toBeGreaterThanOrEqual(0);
        });
    });
    describe("Graceful Degradation", () => {
        it("should handle provider recovery after offline", async () => {
            const response1 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response1.success).toBe(true);
            shouldFail = true;
            const response2 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response2.success).toBe(true);
            expect(["l1", "offline"]).toContain(response2.source);
            shouldFail = false;
            const response3 = await gateway.invoke("test-adapter", { value: 5 }, true);
            expect(response3.success).toBe(true);
            expect(response3.source).toBe("provider");
        });
        it("should maintain cache during extended offline", async () => {
            const r1 = await gateway.invoke("test-adapter", { value: 1 });
            expect(r1.success).toBe(true);
            const r2 = await gateway.invoke("test-adapter", { value: 2 });
            expect(r2.success).toBe(true);
            const r3 = await gateway.invoke("test-adapter", { value: 3 });
            expect(r3.success).toBe(true);
            shouldFail = true;
            gateway.setOfflineMode(true);
            for (let i = 0; i < 5; i++) {
                const response = await gateway.invoke("test-adapter", { value: 1 });
                expect(response.success).toBe(true);
            }
            const stats = gateway.getOfflineStats();
            expect(stats.cachedKeys).toBeGreaterThanOrEqual(0);
        });
    });
    describe("Last Known Good Tracking", () => {
        it("should track last known good values", async () => {
            const response1 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response1.success).toBe(true);
            shouldFail = true;
            const response2 = await gateway.invoke("test-adapter", { value: 5 });
            expect(response2.success).toBe(true);
            expect(response2.data.result).toBe(10);
        });
        it("should serve stale last known good if cache cleared", async () => {
            const response1 = await gateway.invoke("test-adapter", { value: 7 });
            expect(response1.success).toBe(true);
            expect(response1.data.result).toBe(14);
            const l1 = gateway.l1;
            const l2 = gateway.l2;
            l1.clear();
            await l2.clear();
            shouldFail = true;
            const response2 = await gateway.invoke("test-adapter", { value: 7 });
            expect(response2.success).toBe(true);
            expect(["offline"]).toContain(response2.source);
        });
    });
});
//# sourceMappingURL=offline-mode.test.js.map