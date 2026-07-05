import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { CacheKeyGenerator } from "../cache-engine/cache-key";
import { L1MemoryCache } from "../cache-engine/l1-memory-cache";
import { L2DiskCache } from "../cache-engine/l2-disk-cache";
import { CacheLockManager } from "../cache-engine/cache-locks";
import { CacheMetricsCollector } from "../cache-engine/cache-metrics";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
describe("Cache Engine", () => {
    let tempDir;
    beforeEach(async () => {
        tempDir = path.join(os.tmpdir(), `cache-test-${Date.now()}`);
    });
    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch { }
    });
    describe("CacheKeyGenerator", () => {
        it("should generate deterministic hash for same input", () => {
            const input = { b: 2, a: 1 };
            const hash1 = CacheKeyGenerator.compute(input);
            const hash2 = CacheKeyGenerator.compute(input);
            expect(hash1).toBe(hash2);
        });
        it("should generate same hash regardless of key order", () => {
            const input1 = { b: 2, a: 1 };
            const input2 = { a: 1, b: 2 };
            expect(CacheKeyGenerator.compute(input1)).toBe(CacheKeyGenerator.compute(input2));
        });
        it("should include adapter ID in key generation", () => {
            const payload = { x: 1 };
            const key1 = CacheKeyGenerator.computeWithAdapter("adapter-a", payload);
            const key2 = CacheKeyGenerator.computeWithAdapter("adapter-b", payload);
            expect(key1).not.toBe(key2);
        });
        it("should validate SHA256 key format", () => {
            const key = CacheKeyGenerator.compute({ test: 1 });
            expect(CacheKeyGenerator.isValidKey(key)).toBe(true);
        });
        it("should return 64-char hex string", () => {
            const key = CacheKeyGenerator.compute({ test: 1 });
            expect(key).toHaveLength(64);
            expect(/^[a-f0-9]+$/.test(key)).toBe(true);
        });
        it("should handle nested objects", () => {
            const input = { a: { b: { c: 1 } } };
            const hash = CacheKeyGenerator.compute(input);
            expect(CacheKeyGenerator.isValidKey(hash)).toBe(true);
        });
        it("should handle arrays consistently", () => {
            const input1 = { items: [1, 2, 3] };
            const input2 = { items: [1, 2, 3] };
            expect(CacheKeyGenerator.compute(input1)).toBe(CacheKeyGenerator.compute(input2));
        });
    });
    describe("L1MemoryCache", () => {
        let cache;
        beforeEach(() => {
            cache = new L1MemoryCache(3);
        });
        it("should set and get values", () => {
            cache.set("key1", "value1");
            expect(cache.get("key1")).toBe("value1");
        });
        it("should return null for missing keys", () => {
            expect(cache.get("missing")).toBeNull();
        });
        it("should implement LRU eviction", () => {
            cache.set("key1", "value1");
            cache.set("key2", "value2");
            cache.set("key3", "value3");
            expect(cache.size()).toBe(3);
            cache.set("key4", "value4");
            expect(cache.size()).toBe(3);
            expect(cache.get("key1")).toBeNull();
        });
        it("should promote recently accessed keys to end", () => {
            cache.set("key1", "value1");
            cache.set("key2", "value2");
            cache.set("key3", "value3");
            cache.get("key1");
            cache.set("key4", "value4");
            expect(cache.get("key1")).toBe("value1");
            expect(cache.get("key2")).toBeNull();
        });
        it("should handle TTL expiration", () => {
            cache.set("key1", "value1", 100);
            expect(cache.get("key1")).toBe("value1");
            return new Promise((resolve) => {
                setTimeout(() => {
                    expect(cache.get("key1")).toBeNull();
                    resolve(null);
                }, 150);
            });
        });
        it("should delete keys", () => {
            cache.set("key1", "value1");
            expect(cache.delete("key1")).toBe(true);
            expect(cache.get("key1")).toBeNull();
            expect(cache.delete("key1")).toBe(false);
        });
        it("should check key existence", () => {
            cache.set("key1", "value1");
            expect(cache.has("key1")).toBe(true);
            expect(cache.has("missing")).toBe(false);
        });
        it("should clear all entries", () => {
            cache.set("key1", "value1");
            cache.set("key2", "value2");
            cache.clear();
            expect(cache.size()).toBe(0);
        });
        it("should notify on eviction", () => {
            const evicted = [];
            const cacheWithNotify = new L1MemoryCache(2, (key) => evicted.push(key));
            cacheWithNotify.set("key1", "value1");
            cacheWithNotify.set("key2", "value2");
            cacheWithNotify.set("key3", "value3");
            expect(evicted).toContain("key1");
        });
    });
    describe("L2DiskCache", () => {
        let cache;
        beforeEach(async () => {
            cache = new L2DiskCache(tempDir);
            await cache.init();
        });
        it("should set and get values", async () => {
            await cache.set("key1", { data: "value1" });
            const value = await cache.get("key1");
            expect(value).toEqual({ data: "value1" });
        });
        it("should return null for missing keys", async () => {
            const value = await cache.get("missing");
            expect(value).toBeNull();
        });
        it("should persist to disk", async () => {
            await cache.set("key1", { test: 1 });
            const fileExists = await fs
                .access(path.join(tempDir, "key1.json"))
                .then(() => true)
                .catch(() => false);
            expect(fileExists).toBe(true);
        });
        it("should handle TTL expiration", async () => {
            await cache.set("key1", { data: "value1" }, 100);
            const immediate = await cache.get("key1");
            expect(immediate).toEqual({ data: "value1" });
            return new Promise((resolve) => {
                setTimeout(async () => {
                    const expired = await cache.get("key1");
                    expect(expired).toBeNull();
                    resolve(null);
                }, 150);
            });
        });
        it("should delete keys", async () => {
            await cache.set("key1", "value1");
            const deleted = await cache.delete("key1");
            expect(deleted).toBe(true);
            expect(await cache.get("key1")).toBeNull();
        });
        it("should check key existence", async () => {
            await cache.set("key1", "value1");
            expect(await cache.has("key1")).toBe(true);
            expect(await cache.has("missing")).toBe(false);
        });
        it("should clear all entries", async () => {
            await cache.set("key1", "value1");
            await cache.set("key2", "value2");
            await cache.clear();
            expect(await cache.list()).toHaveLength(0);
        });
        it("should list all keys", async () => {
            await cache.set("key1", "value1");
            await cache.set("key2", "value2");
            const keys = await cache.list();
            expect(keys).toContain("key1");
            expect(keys).toContain("key2");
        });
    });
    describe("CacheLockManager", () => {
        let locks;
        beforeEach(() => {
            locks = new CacheLockManager();
        });
        it("should acquire and release locks", async () => {
            const release = await locks.acquireLock("key1");
            expect(locks.isLocked("key1")).toBe(true);
            release();
            expect(locks.isLocked("key1")).toBe(false);
        });
        it("should queue waiting acquires", async () => {
            const order = [];
            const release1 = await locks.acquireLock("key1");
            order.push("first-acquired");
            const second = locks.acquireLock("key1").then(() => {
                order.push("second");
            });
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(order).toEqual(["first-acquired"]);
            release1();
            await second;
            expect(order).toEqual(["first-acquired", "second"]);
        });
        it("should withLock wrapper", async () => {
            let executed = false;
            await locks.withLock("key1", async () => {
                executed = true;
            });
            expect(executed).toBe(true);
            expect(locks.isLocked("key1")).toBe(false);
        });
        it("should clear all locks", async () => {
            const rel1 = await locks.acquireLock("key1");
            const rel2 = await locks.acquireLock("key2");
            locks.clearAll();
            expect(locks.isLocked("key1")).toBe(false);
            expect(locks.isLocked("key2")).toBe(false);
            rel1();
            rel2();
        });
    });
    describe("CacheMetricsCollector", () => {
        let metrics;
        beforeEach(() => {
            metrics = new CacheMetricsCollector();
        });
        it("should record cache hits", () => {
            metrics.recordL1Hit();
            metrics.recordL2Hit();
            const m = metrics.getMetrics();
            expect(m.l1Hits).toBe(1);
            expect(m.l2Hits).toBe(1);
        });
        it("should calculate hit rate", () => {
            metrics.recordL1Hit();
            metrics.recordL1Hit();
            metrics.recordProviderHit();
            const hitRate = metrics.getHitRate();
            expect(hitRate).toBe(2 / 3);
        });
        it("should summarize metrics", () => {
            metrics.recordL1Hit();
            metrics.recordProviderHit();
            const summary = metrics.summarize();
            expect(summary).toContain("L1=1");
            expect(summary).toContain("Provider=1");
        });
        it("should reset metrics", () => {
            metrics.recordL1Hit();
            metrics.reset();
            const m = metrics.getMetrics();
            expect(m.l1Hits).toBe(0);
        });
    });
});
//# sourceMappingURL=cache-engine.test.js.map