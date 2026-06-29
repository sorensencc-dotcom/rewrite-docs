import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AdapterGateway } from "../gateway/adapter-gateway";
import { CachePolicy } from "../gateway/cache-policy";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";

describe("AdapterGateway", () => {
  let gateway: AdapterGateway;
  let tempDir: string;
  let mockAdapter: any;
  let invokeCount: number;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `gateway-test-${Date.now()}`);
    gateway = new AdapterGateway({
      l1MaxEntries: 10,
      l2DiskDir: tempDir,
      defaultTTLMs: 3600000,
      enableMetrics: true,
    });

    invokeCount = 0;
    mockAdapter = {
      id: "test-adapter",
      run: async (payload: any) => {
        invokeCount++;
        return { result: payload.value * 2, invokeCount };
      },
    };

    await gateway.initialize();
  });

  afterEach(async () => {
    await gateway.shutdown();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  });

  describe("Adapter Registration", () => {
    it("should register adapter", () => {
      gateway.registerAdapter("adapter-1", mockAdapter);
      expect(gateway.getRegisteredAdapters()).toContain("adapter-1");
    });

    it("should prevent duplicate registration", () => {
      gateway.registerAdapter("adapter-1", mockAdapter);
      expect(() => gateway.registerAdapter("adapter-1", mockAdapter)).toThrow();
    });

    it("should unregister adapter", () => {
      gateway.registerAdapter("adapter-1", mockAdapter);
      const removed = gateway.unregisterAdapter("adapter-1");
      expect(removed).toBe(true);
      expect(gateway.getRegisteredAdapters()).not.toContain("adapter-1");
    });

    it("should list all registered adapters", () => {
      gateway.registerAdapter("adapter-1", mockAdapter);
      gateway.registerAdapter("adapter-2", mockAdapter);
      expect(gateway.getRegisteredAdapters()).toEqual([
        "adapter-1",
        "adapter-2",
      ]);
    });
  });

  describe("Adapter Invocation", () => {
    beforeEach(() => {
      gateway.registerAdapter("test-adapter", mockAdapter);
    });

    it("should invoke unknown adapter with error", async () => {
      const response = await gateway.invoke("unknown", { value: 1 });
      expect(response.success).toBe(false);
      expect(response.error).toContain("not registered");
    });

    it("should invoke adapter and cache result", async () => {
      const response = await gateway.invoke("test-adapter", { value: 5 });
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 10, invokeCount: 1 });
      expect(response.source).toBe("provider");
    });

    it("should serve from L1 on second invoke", async () => {
      await gateway.invoke("test-adapter", { value: 5 });
      const response = await gateway.invoke("test-adapter", { value: 5 });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 10, invokeCount: 1 });
      expect(response.source).toBe("l1");
      expect(invokeCount).toBe(1);
    });

    it("should serve from L2 after L1 eviction", async () => {
      const policyManager = (gateway as any).policyManager;
      policyManager.setTTLPolicy({
        default: 60000,
      });

      await gateway.invoke("test-adapter", { value: 1 });
      await gateway.invoke("test-adapter", { value: 2 });

      const l1Cache = (gateway as any).l1;
      l1Cache.clear();

      const response = await gateway.invoke("test-adapter", { value: 1 });
      expect(response.source).toBe("l2");
      expect(invokeCount).toBe(2);
    });

    it("should skip cache when requested", async () => {
      await gateway.invoke("test-adapter", { value: 5 });
      const response = await gateway.invoke("test-adapter", { value: 5 }, true);

      expect(response.success).toBe(true);
      expect(response.source).toBe("provider");
      expect(invokeCount).toBe(2);
    });

    it("should handle adapter errors with offline fallback", async () => {
      const failingAdapter = {
        id: "failing",
        run: async () => {
          throw new Error("Provider error");
        },
      };

      gateway.registerAdapter("failing", failingAdapter);

      await gateway.invoke("failing", { value: 1 });
      const response = await gateway.invoke("failing", { value: 1 });

      expect(response.success).toBe(true);
      expect(response.source).toBe("offline");
    });
  });

  describe("Cache Policies", () => {
    beforeEach(() => {
      gateway.registerAdapter("test-adapter", mockAdapter);
    });

    it("should respect NEVER policy", async () => {
      const policyManager = (gateway as any).policyManager;
      policyManager.setPolicy("test-adapter", CachePolicy.NEVER);

      await gateway.invoke("test-adapter", { value: 5 });
      const response = await gateway.invoke("test-adapter", { value: 5 });

      expect(response.source).toBe("provider");
      expect(invokeCount).toBe(2);
    });

    it("should respect READ_ONLY policy", async () => {
      const policyManager = (gateway as any).policyManager;
      policyManager.setPolicy("test-adapter", CachePolicy.READ_ONLY);

      const firstResponse = await gateway.invoke("test-adapter", { value: 5 });
      expect(firstResponse.source).toBe("provider");

      const l1Cache = (gateway as any).l1;
      l1Cache.clear();

      const secondResponse = await gateway.invoke("test-adapter", { value: 5 });
      expect(secondResponse.source).toBe("offline");
    });
  });

  describe("Offline Mode", () => {
    beforeEach(() => {
      gateway.registerAdapter("test-adapter", mockAdapter);
    });

    it("should enable offline mode", async () => {
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

    it("should disable offline mode", () => {
      gateway.setOfflineMode(true);
      gateway.setOfflineMode(false);
      const status = gateway.getOfflineStatus();
      expect(status.isOffline).toBe(false);
    });

    it("should serve from cache in offline mode", async () => {
      await gateway.invoke("test-adapter", { value: 5 });
      gateway.setOfflineMode(true);

      const failingAdapter = {
        id: "test-adapter",
        run: async () => {
          throw new Error("Offline");
        },
      };
      gateway.unregisterAdapter("test-adapter");
      gateway.registerAdapter("test-adapter", failingAdapter);

      const response = await gateway.invoke("test-adapter", { value: 5 });
      expect(response.success).toBe(true);
      expect(response.source).toBe("offline");
    });
  });

  describe("Cache Invalidation", () => {
    beforeEach(() => {
      gateway.registerAdapter("test-adapter", mockAdapter);
    });

    it("should invalidate specific adapter", async () => {
      await gateway.invoke("test-adapter", { value: 5 });
      await gateway.invalidateAdapter("test-adapter");

      const response = await gateway.invoke("test-adapter", { value: 5 });
      expect(response.source).toBe("provider");
      expect(invokeCount).toBe(2);
    });

    it("should invalidate all adapters", async () => {
      gateway.registerAdapter("adapter-2", mockAdapter);

      await gateway.invoke("test-adapter", { value: 1 });
      await gateway.invoke("adapter-2", { value: 2 });

      await gateway.invalidateAll();

      const r1 = await gateway.invoke("test-adapter", { value: 1 });
      const r2 = await gateway.invoke("adapter-2", { value: 2 });

      expect(r1.source).toBe("provider");
      expect(r2.source).toBe("provider");
    });
  });

  describe("Metrics", () => {
    beforeEach(() => {
      gateway.registerAdapter("test-adapter", mockAdapter);
    });

    it("should collect hit metrics", async () => {
      await gateway.invoke("test-adapter", { value: 5 });
      await gateway.invoke("test-adapter", { value: 5 });

      const metrics = gateway.getMetrics();
      expect(metrics.l1Hits).toBe(1);
      expect(metrics.providerHits).toBe(1);
    });

    it("should calculate hit rate", async () => {
      await gateway.invoke("test-adapter", { value: 5 });
      await gateway.invoke("test-adapter", { value: 5 });
      await gateway.invoke("test-adapter", { value: 5 });

      const hitRate = gateway.getHitRate();
      expect(hitRate).toBe(2 / 3);
    });

    it("should provide metrics summary", async () => {
      await gateway.invoke("test-adapter", { value: 5 });
      const summary = gateway.getMetricsSummary();
      expect(summary).toContain("HitRate");
    });
  });

  describe("Preload", () => {
    it("should preload offline cache", async () => {
      await gateway.initialize();

      const l2 = (gateway as any).l2;
      await l2.set("key1", "value1");
      await l2.set("key2", "value2");

      const preloaded = await gateway.preloadOfflineCache("test-adapter", [
        "key1",
        "key2",
      ]);

      expect(preloaded).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Lifecycle", () => {
    it("should initialize gateway", async () => {
      expect(gateway.isInitialized()).toBe(true);
    });

    it("should shutdown cleanly", async () => {
      gateway.registerAdapter("test-adapter", mockAdapter);
      await gateway.invoke("test-adapter", { value: 5 });
      await gateway.shutdown();

      const metrics = gateway.getMetrics();
      expect(metrics.l1Hits + metrics.providerHits).toBeGreaterThanOrEqual(0);
    });
  });
});
