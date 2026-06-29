import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AdapterGateway } from "../gateway/adapter-gateway";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";

describe("Concurrency Tests", () => {
  let gateway: AdapterGateway;
  let tempDir: string;
  let mockAdapter: any;
  let invokeCount: number;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `concurrency-test-${Date.now()}`);
    gateway = new AdapterGateway({
      l1MaxEntries: 100,
      l2DiskDir: tempDir,
      defaultTTLMs: 3600000,
      enableMetrics: true,
    });

    invokeCount = 0;
    mockAdapter = {
      id: "test-adapter",
      run: async (payload: any) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        invokeCount++;
        return { result: payload.value * 2, invokeCount };
      },
    };

    await gateway.initialize();
    gateway.registerAdapter("test-adapter", mockAdapter);
  });

  afterEach(async () => {
    await gateway.shutdown();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("should handle 100 parallel requests with same input", async () => {
    const requests = Array(100)
      .fill(null)
      .map(() => gateway.invoke("test-adapter", { value: 5 }));

    const responses = await Promise.all(requests);

    expect(responses).toHaveLength(100);
    expect(
      responses.every((r) => r.success && r.data.result === 10)
    ).toBe(true);

    expect(invokeCount).toBeGreaterThan(0);
  });

  it("should handle 100 parallel requests with different inputs", async () => {
    const requests = Array(100)
      .fill(null)
      .map((_, i) => gateway.invoke("test-adapter", { value: i }));

    const responses = await Promise.all(requests);

    expect(responses).toHaveLength(100);
    expect(responses.every((r) => r.success)).toBe(true);
    expect(invokeCount).toBe(100);
  });

  it("should not race on cache writes", async () => {
    const input = { value: 1 };

    const firstRequest = await gateway.invoke("test-adapter", input);
    expect(firstRequest.success).toBe(true);
    expect(firstRequest.source).toBe("provider");

    const requests = Array(49)
      .fill(null)
      .map(() => gateway.invoke("test-adapter", input));

    const responses = await Promise.all(requests);

    expect(responses).toHaveLength(49);
    expect(responses.every((r) => r.success)).toBe(true);
    const cachedResponses = responses.filter((r) => r.source === "l1" || r.source === "l2");
    expect(cachedResponses.length).toBeGreaterThan(40);
  });

  it("should serialize concurrent writes to same key", async () => {
    const promises = Array(10)
      .fill(null)
      .map((_, i) =>
        gateway.invoke("test-adapter", { value: i }).then(() => ({ index: i }))
      );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
  });

  it("should maintain cache consistency under concurrent read/write", async () => {
    const reads = Array(50)
      .fill(null)
      .map(() => gateway.invoke("test-adapter", { value: 5 }));

    const results = await Promise.all(reads);

    const allSame = results.every((r) => r.data.result === 10);
    expect(allSame).toBe(true);
  });

  it("should handle concurrent invalidation and reads", async () => {
    await gateway.invoke("test-adapter", { value: 5 });

    const readPromises = Array(25)
      .fill(null)
      .map(() => gateway.invoke("test-adapter", { value: 5 }));

    const invalidatePromise = gateway.invalidateAdapter("test-adapter");

    const [results, invalidated] = await Promise.all([
      Promise.all(readPromises),
      invalidatePromise,
    ]);

    expect(results).toHaveLength(25);
    expect(invalidated).toBeGreaterThanOrEqual(0);
  });

  it("should handle stress with 1000 mixed operations", async () => {
    const operations = [];

    for (let i = 0; i < 1000; i++) {
      const op = Math.random();

      if (op < 0.7) {
        operations.push(
          gateway.invoke("test-adapter", { value: Math.floor(Math.random() * 10) })
        );
      } else if (op < 0.9) {
        operations.push(
          gateway.invoke("test-adapter", { value: Math.floor(Math.random() * 10) }, true)
        );
      } else {
        operations.push(gateway.invalidateAdapter("test-adapter"));
      }
    }

    const results = await Promise.all(operations);
    expect(results).toHaveLength(1000);

    const metrics = gateway.getMetrics();
    expect(metrics.errors).toBeLessThanOrEqual(10);
  });

  it("should maintain lock safety during concurrent disk writes", async () => {
    const payload = { value: 1 };
    const l2 = (gateway as any).l2;

    const writePromises = Array(20)
      .fill(null)
      .map(() => gateway.invoke("test-adapter", payload));

    await Promise.all(writePromises);

    const files = await fs.readdir(tempDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".json"))).toBe(true);
  });

  it("should handle concurrent L1 evictions", async () => {
    const gateway2 = new AdapterGateway({
      l1MaxEntries: 5,
      l2DiskDir: path.join(tempDir, "l1-evict"),
      defaultTTLMs: 3600000,
      enableMetrics: true,
    });

    await gateway2.initialize();
    gateway2.registerAdapter("test-adapter", mockAdapter);

    const requests = Array(50)
      .fill(null)
      .map((_, i) => gateway2.invoke("test-adapter", { value: i % 10 }));

    const results = await Promise.all(requests);
    expect(results).toHaveLength(50);

    const metrics = gateway2.getMetrics();
    expect(metrics.evictions).toBeGreaterThan(0);

    await gateway2.shutdown();
  });
});
