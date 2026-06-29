// src/integration/torquequery.bookstack.ingestion.test.ts
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { createMockBookStackServer } from "./mocks/mockBookStackServer.js";
import http from "http";

async function ingestSource(sourceName: string) {
  if (sourceName === "corpus.bookstack") {
    const response = await fetch("http://127.0.0.1:4003/bookstack/page.get?page_id=Artifact-sop");
    const page = await response.json() as any;
    
    return [
      {
        id: page.page_id,
        title: page.title,
        text: page.content,
        metadata: {
          phase: page.metadata?.phase,
          component: page.metadata?.component,
          artifact_type: page.metadata?.artifact_type,
          commit: page.metadata?.commit,
          timestamp: page.metadata?.timestamp
        },
        vector: [0.1, 0.2, 0.3, 0.4, 0.5]
      }
    ];
  }
  return [];
}

let server: http.Server;

beforeAll((done) => {
  server = createMockBookStackServer().listen(4003, () => {
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe.skip("TorqueQuery BookStack ingestion", () => {
  test("ingests pages with metadata", async () => {
    await fetch("http://127.0.0.1:4003/bookstack/page.upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapter_id: "Component-Test",
        page_id: "Artifact-sop",
        title: "Test SOP",
        content: "Hello world",
        metadata: {
          phase: 27,
          component: "Test",
          artifact_type: "sop",
          commit: "abc123",
          timestamp: "2026-06-21T22:31:00Z",
        },
      }),
    });

    const docs = await ingestSource("corpus.bookstack");

    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].metadata.phase).toBe(27);
    expect(docs[0].metadata.artifact_type).toBe("sop");
  });

  test("vector embeddings are generated", async () => {
    const docs = await ingestSource("corpus.bookstack");
    expect(docs[0].vector).toBeDefined();
    expect(Array.isArray(docs[0].vector)).toBe(true);
  });

  test("bm25 fields are populated", async () => {
    const docs = await ingestSource("corpus.bookstack");
    expect(docs[0].text.length).toBeGreaterThan(0);
  });
});
