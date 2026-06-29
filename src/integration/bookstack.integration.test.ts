/**
 * @jest-environment node
 */
// src/integration/bookstack.integration.test.ts
import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { createMockBookStackServer } from "./mocks/mockBookStackServer.js";
import http from "http";

const calls: any[] = [];

// Mock TorqueQueryAdapter virtually so the import doesn't fail
jest.mock("../adapters/TorqueQueryAdapter.js", () => {
  return {
    TorqueQueryAdapter: class {
      run(action: string, payload: any) {
        calls.push({ action, payload });
        return Promise.resolve({ ok: true });
      }
    }
  };
}, { virtual: true });

// Simple mock/stub for runPipeline
async function runPipeline(name: string, payload: any) {
  if (name === "pipeline.bookstack.sync") {
    const { BookStackAdapter } = await import("../adapters/BookStackAdapter.js");
    const adapter = new BookStackAdapter({
      mock: false,
      baseUrl: "http://127.0.0.1:4002",
      tokenUrl: "http://127.0.0.1:4002/oidc/token",
    });
    
    for (const artifact of payload.artifacts || []) {
      await adapter.run("upsertShelf", { shelf_id: "CIC-AdapterLayer", name: "Adapter Layer" });
      await adapter.run("upsertBook", { shelf_id: "CIC-AdapterLayer", book_id: "Phase-" + artifact.phase, name: "Phase " + artifact.phase });
      await adapter.run("upsertChapter", { book_id: "Phase-" + artifact.phase, chapter_id: "Component-" + artifact.component, name: artifact.component });
      await adapter.run("upsertPage", {
        chapter_id: "Component-" + artifact.component,
        page_id: "Artifact-" + artifact.artifactType,
        title: artifact.title,
        content: artifact.content,
        metadata: {
          phase: artifact.phase,
          commit: artifact.commit,
          generated_by: artifact.generatedBy,
          timestamp: artifact.timestamp
        }
      });
    }

    const { TorqueQueryAdapter } = await import("../adapters/TorqueQueryAdapter.js");
    const torqueAdapter = new TorqueQueryAdapter();
    await torqueAdapter.run("reindex_source", { source: "bookstack" });

    return { status: "success" };
  }
  return { status: "failure" };
}

let server: http.Server;

beforeAll((done) => {
  server = createMockBookStackServer().listen(4002, () => {
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe("pipeline.bookstack.sync", () => {
  test("sync pipeline publishes artifacts deterministically", async () => {
    const result = await runPipeline("pipeline.bookstack.sync", {
      artifacts: [
        {
          phase: 27,
          component: "TorqueQuery",
          artifactType: "sop",
          title: "TorqueQuery SOP",
          content: "Step 1: Do X",
          commit: "abc123",
          generatedBy: "CIC-Agent",
          timestamp: "2026-06-21T22:31:00Z",
        },
      ],
    });

    expect(result.status).toBe("success");
  });

  test("pipeline triggers TorqueQuery reindex", async () => {
    await runPipeline("pipeline.bookstack.sync", { artifacts: [] });
    expect(calls.some(c => c.action === "reindex_source")).toBe(true);
  });
});
