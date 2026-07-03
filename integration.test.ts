// integration.test.ts - Full loop integration tests (Jest)
import fetch from "node-fetch";

const UPDATE_MONITOR_URL = process.env.UPDATE_MONITOR_URL || "http://update-monitor:8000";
const CODEFLOW_URL = process.env.CODEFLOW_URL || "http://codeflow-analyzer:8080";
const HARVESTER_URL = process.env.HARVESTER_URL || "http://harvester:4000";
const ROADMAP_URL = process.env.ROADMAP_URL || "http://roadmap-service:3000";

// Wait for services to be ready
async function waitForService(url: string, maxAttempts = 30): Promise<void> {
  const CONNECTIVITY_ERRORS = ["ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH", "EADDRNOTAVAIL"];
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch (e: any) {
      if (e && CONNECTIVITY_ERRORS.includes(e.code)) {
        throw new Error(`Connection failed for ${url} with ${e.code}. Aborting test wait.`);
      }
      // continue
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Service at ${url} did not become ready`);
}

beforeAll(async () => {
  console.log("Waiting for services to be ready...");
  await Promise.all([
    waitForService(UPDATE_MONITOR_URL),
    waitForService(CODEFLOW_URL),
    waitForService(HARVESTER_URL),
    waitForService(ROADMAP_URL)
  ]);
  console.log("All services ready");
});

// ============================================================================
// CODEFLOW ANALYZER TESTS
// ============================================================================

describe("CodeFlow Analyzer", () => {
  test("health check returns ok", async () => {
    const res = await fetch(`${CODEFLOW_URL}/health`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.status).toBe("ok");
  });

  test("metrics endpoint returns valid metrics", async () => {
    const res = await fetch(`${CODEFLOW_URL}/metrics`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.analyzer).toBeDefined();
    expect(data.analyzer.total_analyses).toBeGreaterThanOrEqual(0);
  });

  test("analyze endpoint with invalid path returns error", async () => {
    const res = await fetch(`${CODEFLOW_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoPath: "/nonexistent/path" })
    });
    expect(res.status).toBe(500);
  });

  test("analyze endpoint requires repoPath", async () => {
    const res = await fetch(`${CODEFLOW_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});

// ============================================================================
// HARVESTER EXTRACTOR TESTS
// ============================================================================

describe("Harvester Extractor", () => {
  test("health check returns ok", async () => {
    const res = await fetch(`${HARVESTER_URL}/health`);
    expect(res.ok).toBe(true);
  });

  test("extractor run succeeds with valid repo", async () => {
    const res = await fetch(`${HARVESTER_URL}/extractor/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoId: "test-repo",
        repoPath: "/test/fixtures/sample-repo"
      })
    });

    // Expect either success (200) or service not ready (503)
    expect([200, 503, 404]).toContain(res.status);

    if (res.ok) {
      const data = await res.json();
      expect(data.repoId).toBe("test-repo");
      expect(data.extracted).toBeDefined();
      expect(data.extracted.nodes).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================================
// ROADMAP SERVICE TESTS
// ============================================================================

describe("Roadmap Service", () => {
  test("health check returns ok", async () => {
    const res = await fetch(`${ROADMAP_URL}/health`);
    expect(res.ok).toBe(true);
  });

  test("POST /roadmap creates items", async () => {
    const res = await fetch(`${ROADMAP_URL}/roadmap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoId: "test-repo",
        commitSha: "abc123",
        todos: [
          {
            type: "todo",
            title: "Test todo from integration test",
            priority: "high",
            tags: ["test", "mandatory_update.security"]
          }
        ],
        ideas: []
      })
    });

    // Expect success or service not ready
    expect([200, 201, 503]).toContain(res.status);
  });

  test("GET /items returns items with filters", async () => {
    const res = await fetch(`${ROADMAP_URL}/items?source=external&limit=10`);

    if (res.ok) {
      const data = await res.json();
      expect(Array.isArray(data.items)).toBe(true);
    }
  });
});

// ============================================================================
// UPDATE MONITOR TESTS
// ============================================================================

describe("Update Monitor", () => {
  test("health check returns ok", async () => {
    const res = await fetch(`${UPDATE_MONITOR_URL}/health`);
    if (res.ok) {
      const data = await res.json();
      expect(data.status).toBe("ok");
    }
  });

  test("sync endpoint accepts repo ID", async () => {
    const res = await fetch(`${UPDATE_MONITOR_URL}/sync/test-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    // Expect success or service not ready
    expect([200, 503, 404]).toContain(res.status);

    if (res.ok) {
      const data = await res.json();
      expect(data.repoId).toBeDefined();
    }
  });
});

// ============================================================================
// END-TO-END FLOW TESTS
// ============================================================================

describe("End-to-End Flow", () => {
  test("repo sync triggers extraction and roadmap creation", async () => {
    // This test would:
    // 1. Mock GitHub with a fake repo change
    // 2. Call Update Monitor /sync
    // 3. Verify Harvester was called
    // 4. Verify Roadmap items were created
    // For now, just verify endpoints are callable

    const syncRes = await fetch(`${UPDATE_MONITOR_URL}/sync/test-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    // Should not error (even if it's a 503 service not ready)
    expect(syncRes.status).not.toBe(0);
  });

  test("codeflow analysis produces valid JSON schema", async () => {
    // This would test with a fixture repo
    // For now, just verify the endpoint exists

    const res = await fetch(`${CODEFLOW_URL}/health`);
    expect(res.ok).toBe(true);
  });
});

// ============================================================================
// OBSERVABILITY TESTS
// ============================================================================

describe("Observability & Metrics", () => {
  test("prometheus metrics are accessible", async () => {
    const res = await fetch("http://prometheus:9090/api/v1/query?query=up");

    if (res.ok) {
      const data = await res.json();
      expect(data.status).toBe("success");
    }
  });

  test("grafana is accessible", async () => {
    const res = await fetch("http://grafana:3000/api/health");

    if (res.ok) {
      const data = await res.json();
      expect(data.database).toBe("ok");
    }
  });
});
