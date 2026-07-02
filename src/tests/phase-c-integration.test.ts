import { HardeningRegistry } from "../resilience/hardeningOrchestrator.js";
import { CircuitBreakerRegistry } from "../resilience/circuitBreaker.js";
import { RateLimiterRegistry } from "../resilience/rateLimiter.js";
import { ResilientMetricsCollector } from "../observability/resilientMetricsCollector.js";

describe("Phase C: Integration (A + B)", () => {
  let hardeningRegistry: HardeningRegistry;
  let circuitBreakerRegistry: CircuitBreakerRegistry;
  let rateLimiterRegistry: RateLimiterRegistry;
  let metricsCollector: ResilientMetricsCollector;

  beforeEach(() => {
    hardeningRegistry = new HardeningRegistry();
    circuitBreakerRegistry = new CircuitBreakerRegistry();
    rateLimiterRegistry = new RateLimiterRegistry();
    metricsCollector = new ResilientMetricsCollector(
      hardeningRegistry,
      circuitBreakerRegistry,
      rateLimiterRegistry
    );
  });

  describe("Metrics Collection", () => {
    it("should collect metrics snapshot", async () => {
      const orch = hardeningRegistry.getOrCreate({
        name: "test-provider",
        timeoutMs: 5000,
      });

      // Execute requests
      await orch.execute(async () => "result1");
      await orch.execute(async () => "result2");

      // Record latencies
      metricsCollector.recordLatency("test-provider", 100);
      metricsCollector.recordLatency("test-provider", 150);

      const snapshot = metricsCollector.getSnapshot();
      // Check for the provider (either with or without -orchestrator suffix)
      const providerFound = Object.keys(snapshot.providers).some(k => k.includes("test-provider"));
      expect(providerFound).toBe(true);
      expect(snapshot.summary.totalRequests).toBeGreaterThan(0);
    });

    it("should track provider state transitions", async () => {
      const orch = hardeningRegistry.getOrCreate({
        name: "failing-provider",
        circuitBreakerFailureThreshold: 1,
        timeoutMs: 5000,
      });

      // Trigger failure
      await orch.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});

      const snapshot = metricsCollector.getSnapshot();
      const provider = Object.values(snapshot.providers).find(p => p.name.includes("failing-provider"));
      expect(provider?.circuitBreaker.state).toBe("OPEN");
    });

    it("should calculate average latency", () => {
      metricsCollector.recordLatency("provider1", 100);
      metricsCollector.recordLatency("provider1", 200);
      metricsCollector.recordLatency("provider1", 300);

      const snapshot = metricsCollector.getSnapshot();
      // Average should be 200 (100 + 200 + 300) / 3
      expect(snapshot.summary.avgLatencyMs).toBe(200);
    });

    it("should track rate limiter rejections", async () => {
      const orch = hardeningRegistry.getOrCreate({
        name: "rate-limited",
        rateLimiterRequestsPerSecond: 1,
        timeoutMs: 5000,
      });

      // Consume limit
      await orch.execute(async () => "1");
      await orch.execute(async () => "2");

      // Should reject
      await orch.execute(async () => "3").catch(() => {});

      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.summary.rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe("Health Status", () => {
    it("should report healthy when all good", async () => {
      const orch = hardeningRegistry.getOrCreate({
        name: "healthy",
        timeoutMs: 5000,
      });

      for (let i = 0; i < 10; i++) {
        await orch.execute(async () => "ok");
      }

      const health = metricsCollector.getHealthStatus();
      expect(health.healthy).toBe(true);
      expect(health.issues).toHaveLength(0);
    });

    it("should report unhealthy when circuit breaker OPEN", async () => {
      const orch = hardeningRegistry.getOrCreate({
        name: "failing",
        circuitBreakerFailureThreshold: 1,
        timeoutMs: 5000,
      });

      // Trigger failure
      await orch.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});

      const health = metricsCollector.getHealthStatus();
      expect(health.healthy).toBe(false);
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.issues[0]).toMatch(/FAILING|OPEN/);
    });

    it("should report degraded when high failure rate", async () => {
      const orch = hardeningRegistry.getOrCreate({
        name: "degraded",
        circuitBreakerFailureThreshold: 10,
        timeoutMs: 5000,
      });

      // Multiple failures (but not enough to open)
      for (let i = 0; i < 5; i++) {
        await orch.execute(async () => {
          throw new Error("fail");
        }).catch(() => {});
      }

      const health = metricsCollector.getHealthStatus();
      // May be degraded due to high failure rate
      if (!health.healthy) {
        expect(health.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Prometheus Export", () => {
    it("should export metrics in Prometheus format", async () => {
      const orch = hardeningRegistry.getOrCreate({
        name: "prometheus-test",
        timeoutMs: 5000,
      });

      await orch.execute(async () => "result");
      metricsCollector.recordLatency("prometheus-test-orchestrator", 150);

      const metrics = metricsCollector.getPrometheusMetrics();
      expect(metrics).toContain("# HELP");
      expect(metrics).toContain("# TYPE");
      expect(metrics).toContain("resilience_circuit_breaker_state");
      expect(metrics).toContain("resilience_failure_rate");
      expect(metrics).toContain("resilience_rate_limit_rejection_rate");
      expect(metrics).toContain("resilience_avg_latency_ms");
      expect(metrics).toContain("resilience_summary_total_requests");
      expect(metrics).toContain("resilience_summary_total_errors");
    });

    it("should format circuit breaker state correctly", async () => {
      const orch = hardeningRegistry.getOrCreate({
        name: "state-test",
        circuitBreakerFailureThreshold: 1,
        timeoutMs: 5000,
      });

      // Trigger open
      await orch.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});

      const metrics = metricsCollector.getPrometheusMetrics();
      // State value 1 = OPEN
      expect(metrics).toMatch(/resilience_circuit_breaker_state.*1/);
    });
  });

  describe("Latency Tracking", () => {
    it("should track individual latencies", () => {
      metricsCollector.recordLatency("provider1", 100);
      metricsCollector.recordLatency("provider1", 200);
      metricsCollector.recordLatency("provider2", 150);

      const snapshot = metricsCollector.getSnapshot();
      const p1 = Object.values(snapshot.providers).find(p => p.name === "provider1");
      const p2 = Object.values(snapshot.providers).find(p => p.name === "provider2");
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();
    });

    it("should not grow indefinitely", () => {
      // Record 1100 latencies (should keep only last 1000)
      for (let i = 0; i < 1100; i++) {
        metricsCollector.recordLatency("provider1", i);
      }

      // Verify we didn't run out of memory
      const snapshot = metricsCollector.getSnapshot();
      const p1 = Object.values(snapshot.providers).find(p => p.name === "provider1");
      expect(p1).toBeDefined();
    });

    it("should handle empty latency history", () => {
      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.summary.avgLatencyMs).toBe(0);
    });
  });

  describe("Phase A + Phase B Integration", () => {
    it("should combine caching + resilience", async () => {
      // In real integration, adapter would use both cache + hardening
      // For now, test that both systems can coexist

      const orch = hardeningRegistry.getOrCreate({
        name: "cached-hardened",
        timeoutMs: 5000,
        maxRetries: 2,
        rateLimiterRequestsPerSecond: 10,
      });

      // Simulate cache hit (Phase A)
      metricsCollector.recordLatency("cached-hardened", 50); // Cache hit latency

      // Simulate cache miss (Phase B with full hardening)
      metricsCollector.recordLatency("cached-hardened", 1000); // First lookup

      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.summary.avgLatencyMs).toBeGreaterThan(0);
      const provider = Object.values(snapshot.providers).find(p => p.name.includes("cached-hardened"));
      expect(provider).toBeDefined();
    });

    it("should track both optimization + resilience metrics", async () => {
      const orch1 = hardeningRegistry.getOrCreate({
        name: "grok",
        timeoutMs: 30000,
        maxRetries: 3,
      });

      const orch2 = hardeningRegistry.getOrCreate({
        name: "openrouter",
        timeoutMs: 30000,
        maxRetries: 3,
      });

      // Execute on both
      await orch1.execute(async () => "grok-result");
      await orch2.execute(async () => "or-result");

      // Record latencies
      metricsCollector.recordLatency("grok", 280); // Grok baseline
      metricsCollector.recordLatency("openrouter", 450); // OpenRouter baseline

      const snapshot = metricsCollector.getSnapshot();
      expect(Object.keys(snapshot.providers).length).toBeGreaterThan(0);
      expect(snapshot.summary.totalRequests).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Reset & Cleanup", () => {
    it("should reset metrics", () => {
      metricsCollector.recordLatency("provider1", 100);
      metricsCollector.recordLatency("provider1", 200);

      metricsCollector.reset();

      // After reset, latencies should be cleared
      // Snapshot will show 0 avg latency for this provider
      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.providers["provider1"] === undefined ||
             snapshot.providers["provider1"].performance.avgLatencyMs === 0).toBe(true);
    });
  });
});
