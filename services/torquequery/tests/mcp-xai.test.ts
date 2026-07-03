import { chunkMarkdown } from "../src/shared/utils/chunking";
import { embedText, embedChunks } from "../src/shared/utils/embedding";
import { normalizeSearch, normalizePage } from "../src/ingest/xai/normalize";
import { XaiMcpClient } from "../src/ingest/xai/client";
import { jest, describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Phase 26: xAI Docs MCP Ingestion Utilities", () => {
  describe("Markdown Chunking", () => {
    it("splits markdown paragraphs correctly", () => {
      const text = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
      const chunks = chunkMarkdown(text, 20, 0);
      expect(chunks.length).toBe(3);
      expect(chunks[0]).toBe("Paragraph 1");
      expect(chunks[1]).toBe("Paragraph 2");
      expect(chunks[2]).toBe("Paragraph 3");
    });

    it("respects overlap size", () => {
      const text = "Paragraph 1\n\nParagraph 2";
      const chunks = chunkMarkdown(text, 20, 5);
      expect(chunks.length).toBe(2);
      expect(chunks[0]).toBe("Paragraph 1");
      expect(chunks[1]).toBe("aph 1\n\nParagraph 2");
    });

    it("falls back to character splitting on very large paragraphs", () => {
      const text = "A".repeat(100);
      const chunks = chunkMarkdown(text, 40, 10);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].length).toBe(40);
    });

    it("returns empty array for empty inputs", () => {
      expect(chunkMarkdown("")).toEqual([]);
    });
  });

  describe("Deterministic Embeddings", () => {
    it("generates 768-dimensional vectors", () => {
      const vec = embedText("hello world");
      expect(vec.length).toBe(768);
      expect(vec.every(n => typeof n === "number")).toBe(true);
      expect(vec.every(n => n >= -0.5 && n <= 0.5)).toBe(true);
    });

    it("is completely deterministic", () => {
      const vec1 = embedText("test string");
      const vec2 = embedText("test string");
      expect(vec1).toEqual(vec2);

      const diffVec = embedText("other string");
      expect(vec1).not.toEqual(diffVec);
    });

    it("embeds a batch of chunks", async () => {
      const chunks = [{ text: "first" }, { text: "second" }];
      const vectors = await embedChunks(chunks);
      expect(vectors.length).toBe(2);
      expect(vectors[0].length).toBe(768);
      expect(vectors[1].length).toBe(768);
    });
  });

  describe("MCP Normalization", () => {
    it("normalizes search results", () => {
      const mockResult = {
        data: {
          items: [
            { slug: "quickstart", title: "Quickstart Guide", snippet: "Get started fast" },
            { slug: "rate-limits", title: "Rate Limits", preview: "Limit details" },
          ],
        },
      };

      const normalized = normalizeSearch(mockResult);
      expect(normalized.length).toBe(2);
      expect(normalized[0]).toEqual({
        slug: "quickstart",
        title: "Quickstart Guide",
        snippet: "Get started fast",
      });
      expect(normalized[1]).toEqual({
        slug: "rate-limits",
        title: "Rate Limits",
        snippet: "Limit details",
      });
    });

    it("normalizes document pages", () => {
      const mockPage = {
        data: {
          item: {
            slug: "api-reference",
            title: "API Reference",
            content: "Detailed reference",
            url: "https://docs.x.ai/api-reference",
          },
        },
      };

      const normalized = normalizePage(mockPage);
      expect(normalized).toEqual({
        slug: "api-reference",
        title: "API Reference",
        content: "Detailed reference",
        url: "https://docs.x.ai/api-reference",
      });
    });
  });

  describe("JSON-RPC Client (Mocked)", () => {
    let originalFetch: typeof fetch;

    beforeAll(() => {
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it("makes search request successfully", async () => {
      const mockResponse = {
        jsonrpc: "2.0",
        id: "xai-mcp-1",
        result: {
          items: [{ slug: "test", title: "Test Doc" }],
        },
      };

      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      ) as any;

      const client = new XaiMcpClient();
      const res = await client.search("test-query", 5);

      expect(res.data).toEqual(mockResponse.result);
      expect(res.lineage.method).toBe("tools/call");
      expect(res.lineage.toolName).toBe("search_docs");
      expect(res.lineage.arguments).toEqual({
        name: "search_docs",
        arguments: { query: "test-query", max_results: 5 }
      });
    });

    it("retries on temporary server error", async () => {
      const mockResult = { items: [] };
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 502,
            statusText: "Bad Gateway",
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              jsonrpc: "2.0",
              id: "xai-mcp-retry",
              result: mockResult,
            }),
        } as Response);
      }) as any;

      const client = new XaiMcpClient({ maxRetries: 2, timeoutMs: 1000 });
      const res = await client.listPages();

      expect(callCount).toBe(2);
      expect(res.data).toEqual(mockResult);
      expect(res.lineage.attempt).toBe(2);
    });
  });
});
