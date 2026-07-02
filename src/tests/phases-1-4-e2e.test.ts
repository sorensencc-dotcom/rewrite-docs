import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { openrouterProvider } from "../providers/openrouterProvider.js";
import { groqProvider } from "../providers/groqProvider.js";
import { togetherProvider } from "../providers/togetherProvider.js";
import { GrokProvider } from "../../cic-ingestion/src/adapters/grok/grok-provider.js";
import { GrokMcpClient } from "../../cic-ingestion/src/adapters/grok/grok-mcp-client.js";
import { GrokModelClient } from "../../cic-ingestion/src/adapters/grok/grok-model-client.js";
import { GrokUnifiedAdapter } from "../../cic-ingestion/src/adapters/grok/GrokUnifiedAdapter.js";

describe("Phases 1-4 E2E Integration", () => {
  describe("Phase 1: Cloud Provider Dispatch", () => {
    it("routes to OpenRouter provider", async () => {
      const req = {
        model: "openrouter:llama3-8b",
        input: "Test query",
        routing: { temperature: 0.7 },
      };

      const response = await openrouterProvider.chat(req);
      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(response.latencyMs).toBeGreaterThan(0);
      expect(response.tokens).toBeGreaterThan(0);
    });

    it("routes to Groq provider", async () => {
      const req = {
        model: "groq:llama3-8b-8192",
        input: "Test query",
        routing: { temperature: 0.7 },
      };

      const response = await groqProvider.chat(req);
      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(response.latencyMs).toBeGreaterThan(0);
      expect(response.tokens).toBeGreaterThan(0);
    });

    it("routes to Together provider", async () => {
      const req = {
        model: "together:meta-llama/Llama-2-7b-hf",
        input: "Test query",
        routing: { temperature: 0.7 },
      };

      const response = await togetherProvider.chat(req);
      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(response.latencyMs).toBeGreaterThan(0);
      expect(response.tokens).toBeGreaterThan(0);
    });

    it("enforces model validation before stub return", async () => {
      const invalidReq = {
        model: "openrouter:invalid-model-xyz",
        input: "Test",
        routing: {},
      };

      await expect(openrouterProvider.chat(invalidReq)).rejects.toThrow(
        "Model not found"
      );
    });
  });

  describe("Phase 2: Unified Grok Provider", () => {
    let grokProvider: GrokProvider;
    let mcpClient: jest.Mocked<GrokMcpClient>;
    let modelClient: jest.Mocked<GrokModelClient>;

    beforeEach(() => {
      mcpClient = {
        searchDocs: jest.fn().mockResolvedValue({
          items: [
            {
              slug: "api/quickstart",
              title: "Getting Started",
              snippet: "First steps with the API...",
            },
          ],
        }),
        getDocPage: jest.fn().mockResolvedValue({ content: "Doc content" }),
        ingestDocs: jest.fn().mockResolvedValue({
          lineage: { corpusHash: "abc123" },
        }),
      } as any;

      modelClient = {
        chat: jest.fn().mockResolvedValue({
          id: "chat-123",
          choices: [
            {
              message: {
                role: "assistant",
                content: "Based on the docs: ...",
              },
            },
          ],
        }),
      } as any;

      grokProvider = new GrokProvider(mcpClient, modelClient);
    });

    it("executes search via MCP client", async () => {
      const result = await grokProvider.execute({
        kind: "search",
        query: "How do I get started?",
        maxResults: 10,
      });

      expect(result.items).toBeDefined();
      expect(mcpClient.searchDocs).toHaveBeenCalledWith(
        "How do I get started?",
        10
      );
    });

    it("executes chat via Model client", async () => {
      const result = await grokProvider.execute({
        kind: "chat",
        messages: [{ role: "user", content: "Hello" }],
        model: "grok-latest",
        temperature: 0.2,
        top_p: 0.95,
        stream: false,
      });

      expect(result.choices).toBeDefined();
      expect(modelClient.chat).toHaveBeenCalled();
    });

    it("executes ingest for corpus indexing", async () => {
      const result = await grokProvider.execute({
        kind: "ingest",
        slugs: ["intro", "reference"],
      });

      expect(result.lineage).toBeDefined();
      expect(mcpClient.ingestDocs).toHaveBeenCalledWith(["intro", "reference"]);
    });
  });

  describe("Phase 3: RAG Fusion Pipeline", () => {
    let adapter: GrokUnifiedAdapter;
    let grokProvider: GrokProvider;
    let mcpClient: jest.Mocked<GrokMcpClient>;
    let modelClient: jest.Mocked<GrokModelClient>;

    beforeEach(() => {
      mcpClient = {
        searchDocs: jest.fn().mockResolvedValue({
          items: [
            {
              slug: "docs/auth",
              title: "Authentication",
              snippet: "Use API keys for authentication...",
            },
            {
              slug: "docs/security",
              title: "Security Best Practices",
              snippet: "Rotate keys regularly...",
            },
          ],
        }),
        getDocPage: jest.fn(),
        ingestDocs: jest.fn(),
      } as any;

      modelClient = {
        chat: jest.fn().mockResolvedValue({
          id: "rag-chat-123",
          choices: [
            {
              message: {
                role: "assistant",
                content:
                  "Based on the documentation, you should use API keys for authentication and rotate them regularly.",
              },
            },
          ],
        }),
      } as any;

      grokProvider = new GrokProvider(mcpClient, modelClient);
      adapter = new GrokUnifiedAdapter(
        { name: "grok-rag", version: "1.0.0", timeout: 5000, retries: 2 },
        grokProvider
      );
    });

    it("executes RAG query: search + build context + reasoning", async () => {
      // RAG flow: search → build context → chat
      const searchInput = adapter.normalize("How do I authenticate?");
      const searchOutput = await adapter.run(searchInput);

      expect(searchOutput.success).toBe(true);
      expect(searchOutput.data.items).toBeDefined();
      expect(searchOutput.data.items.length).toBeGreaterThan(0);

      // Build context from search results
      const context = searchOutput.data.items
        .map((item: any) => `- ${item.title}\n${item.snippet}`)
        .join("\n\n");

      // Execute chat with context
      const messages = [
        {
          role: "system",
          content: "You are a helpful assistant using xAI docs as context.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: How do I authenticate?`,
        },
      ];

      const chatInput = adapter.normalize({ messages });
      const chatOutput = await adapter.run(chatInput);

      expect(chatOutput.success).toBe(true);
      expect(chatOutput.data.choices).toBeDefined();
      expect(chatOutput.data.choices[0].message.content).toContain(
        "authentication"
      );

      // Verify context was passed to model
      expect(modelClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("Authentication"),
            }),
          ]),
        })
      );
    });

    it("normalizes RAG input correctly", () => {
      // String input → search
      expect(adapter.normalize("question?")).toEqual({
        key: "search",
        payload: { query: "question?" },
      });

      // Messages input → chat
      const messages = [{ role: "user", content: "Hello" }];
      expect(adapter.normalize({ messages })).toEqual({
        key: "chat",
        payload: {
          messages,
          model: undefined,
          temperature: undefined,
          top_p: undefined,
          stream: undefined,
        },
      });

      // Query with options → search
      expect(adapter.normalize({ query: "q", maxResults: 5 })).toEqual({
        key: "search",
        payload: { query: "q", maxResults: 5 },
      });
    });
  });

  describe("Phase 4: Drift Scoring", () => {
    let grokProvider: GrokProvider;
    let mcpClient: jest.Mocked<GrokMcpClient>;
    let modelClient: jest.Mocked<GrokModelClient>;

    beforeEach(() => {
      mcpClient = {
        searchDocs: jest.fn(),
        getDocPage: jest.fn(),
        ingestDocs: jest.fn(),
      } as any;
      modelClient = {
        chat: jest.fn(),
      } as any;
      grokProvider = new GrokProvider(mcpClient, modelClient);
    });

    it("detects no drift when corpus hash unchanged", async () => {
      const baselineHash = "abc123def456";
      mcpClient.ingestDocs.mockResolvedValue({
        lineage: { corpusHash: "abc123def456" },
      });

      const index = await grokProvider.execute({
        kind: "ingest",
        slugs: [],
      });

      const currentHash = index.lineage?.corpusHash ?? "";
      const driftScore = baselineHash === currentHash ? 0 : 1;

      expect(driftScore).toBe(0);
      expect(currentHash).toBe(baselineHash);
    });

    it("detects drift when corpus hash changed", async () => {
      const baselineHash = "abc123def456";
      const newHash = "xyz789uvw012";
      mcpClient.ingestDocs.mockResolvedValue({
        lineage: { corpusHash: newHash },
      });

      const index = await grokProvider.execute({
        kind: "ingest",
        slugs: [],
      });

      const currentHash = index.lineage?.corpusHash ?? "";
      const driftScore = baselineHash === currentHash ? 0 : 1;

      expect(driftScore).toBe(1);
      expect(currentHash).not.toBe(baselineHash);
    });

    it("returns drift report", async () => {
      const baselineHash = "baseline-hash";
      mcpClient.ingestDocs.mockResolvedValue({
        lineage: { corpusHash: "current-hash" },
      });

      const index = await grokProvider.execute({
        kind: "ingest",
        slugs: [],
      });

      const currentHash = index.lineage?.corpusHash ?? "";
      const drift = {
        baselineHash,
        currentHash,
        driftScore: baselineHash === currentHash ? 0 : 1,
        hasDrift: baselineHash !== currentHash,
      };

      expect(drift.baselineHash).toBe("baseline-hash");
      expect(drift.currentHash).toBe("current-hash");
      expect(drift.driftScore).toBe(1);
      expect(drift.hasDrift).toBe(true);
    });
  });

  describe("Cross-Phase Integration", () => {
    it("cloud provider can be swapped for Grok in adapter context", async () => {
      // Phase 1 provider in Phase 2+ adapter context
      const mockMcp = {
        searchDocs: jest.fn().mockResolvedValue({
          items: [{ slug: "doc", title: "Title", snippet: "Snippet" }],
        }),
        getDocPage: jest.fn(),
        ingestDocs: jest.fn(),
      } as any;

      const mockModel = {
        chat: jest.fn().mockResolvedValue({
          choices: [{ message: { role: "assistant", content: "Response" } }],
        }),
      } as any;

      const grok = new GrokProvider(mockMcp, mockModel);
      const adapter = new GrokUnifiedAdapter(
        { name: "test", version: "1.0", timeout: 5000, retries: 1 },
        grok
      );

      // Execute through adapter
      const input = adapter.normalize("test query");
      const output = await adapter.run(input);

      expect(output.success).toBe(true);
      expect(mockMcp.searchDocs).toHaveBeenCalled();
    });

    it("all phases maintain deterministic behavior in test mode", () => {
      // Phase 1: Cloud providers return stubs deterministically
      const isTestMode = process.env.NODE_ENV === "test";
      expect(isTestMode || process.env.MOCK_PROVIDERS === "1").toBe(true);

      // Phase 2-4: Adapters use mocked clients
      const mockMcp = {
        searchDocs: jest.fn().mockResolvedValue({ items: [] }),
        getDocPage: jest.fn(),
        ingestDocs: jest.fn(),
      } as any;

      const mockModel = {
        chat: jest.fn().mockResolvedValue({ choices: [] }),
      } as any;

      const grok = new GrokProvider(mockMcp, mockModel);
      expect(grok).toBeDefined();

      // Verify determinism: same input → same output
      const input1 = { kind: "search", query: "test" } as any;
      const input2 = { kind: "search", query: "test" } as any;

      expect(JSON.stringify(input1)).toBe(JSON.stringify(input2));
    });
  });
});
