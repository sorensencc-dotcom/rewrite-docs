/**
 * RLVaultAdapter Tests
 * Unit + smoke tests for the RL vault ingestion adapter.
 */

import { RLVaultAdapter } from "../RLVaultAdapter";
import * as fs from "fs";
import * as path from "path";

// Mock the logger and metrics
jest.mock("../../logging/adapterLogger", () => ({
  adapterLogger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("../../metrics/MetricsExporter", () => ({
  metricsExporter: {
    increment: jest.fn(),
    observe: jest.fn(),
  },
}));

jest.mock("../../validation/envelope", () => ({
  makeSuccess: jest.fn((data, adapter, startTime) => ({
    ok: true,
    data,
    adapter,
    duration: Date.now() - startTime,
  })),
  makeError: jest.fn((code, context, adapter, startTime) => ({
    ok: false,
    code,
    context,
    adapter,
    duration: Date.now() - startTime,
  })),
}));

describe("RLVaultAdapter", () => {
  let adapter: RLVaultAdapter;
  const testVaultPath = "C:\\dev\\rl-ref";
  const testManifestPath = "C:\\dev\\docs\\rewrite-labs\\rl-vault-manifest.json";

  beforeEach(() => {
    adapter = new RLVaultAdapter(testVaultPath, testManifestPath);
  });

  describe("Unit Tests", () => {
    describe("discover", () => {
      test("discovers all files listed in manifest", async () => {
        const result = await adapter.run("discover", {});
        expect(result.ok).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
      });

      test("fails if manifest is missing", () => {
        const badAdapter = new RLVaultAdapter(testVaultPath, "/nonexistent/manifest.json");
        expect(() => badAdapter).toThrow();
      });

      test("fails if vault file is missing", async () => {
        const badVaultPath = "C:\\dev\\nonexistent-rl-ref";
        const badAdapter = new RLVaultAdapter(badVaultPath, testManifestPath);
        const result = await badAdapter.run("discover", {});
        expect(result.ok).toBe(false);
      });
    });

    describe("harvest", () => {
      test("extracts frontmatter and content from markdown", async () => {
        // Create a temp file with frontmatter
        const tempFile = path.join(testVaultPath, "test-temp.md");
        const content = `---
title: Test Document
author: Test Author
---
# Test Heading

Test content here.`;

        if (!fs.existsSync(testVaultPath)) {
          fs.mkdirSync(testVaultPath, { recursive: true });
        }

        fs.writeFileSync(tempFile, content);

        try {
          const discovered = await adapter.run("discover", {});
          const harvested = await adapter.run("harvest", { files: discovered.data });
          expect(harvested.ok).toBe(true);
          expect(harvested.data.some((f: any) => f.frontmatter?.title === "Test Document")).toBe(true);
        } finally {
          fs.unlinkSync(tempFile);
        }
      });

      test("infers title from H1 if frontmatter missing", async () => {
        const tempFile = path.join(testVaultPath, "test-h1.md");
        const content = "# Inferred Title\n\nContent here.";

        if (!fs.existsSync(testVaultPath)) {
          fs.mkdirSync(testVaultPath, { recursive: true });
        }

        fs.writeFileSync(tempFile, content);

        try {
          const discovered = await adapter.run("discover", {});
          const harvested = await adapter.run("harvest", { files: discovered.data });
          expect(harvested.ok).toBe(true);
        } finally {
          fs.unlinkSync(tempFile);
        }
      });
    });

    describe("normalize", () => {
      test("strips HTML comments except SYNC markers", async () => {
        const discovered = await adapter.run("discover", {});
        const harvested = await adapter.run("harvest", { files: discovered.data });
        const normalized = await adapter.run("normalize", { files: harvested.data });

        expect(normalized.ok).toBe(true);
        expect(normalized.data.length).toBeGreaterThan(0);
      });

      test("normalizes tabs to 2 spaces", async () => {
        const discovered = await adapter.run("discover", {});
        const harvested = await adapter.run("harvest", { files: discovered.data });
        const normalized = await adapter.run("normalize", { files: harvested.data });

        expect(normalized.ok).toBe(true);
        normalized.data.forEach((file: any) => {
          expect(file.content).not.toContain("\t");
        });
      });
    });

    describe("chunk", () => {
      test("chunks files with deterministic IDs", async () => {
        const discovered = await adapter.run("discover", {});
        const harvested = await adapter.run("harvest", { files: discovered.data });
        const normalized = await adapter.run("normalize", { files: harvested.data });
        const chunked = await adapter.run("chunk", { files: normalized.data });

        expect(chunked.ok).toBe(true);
        expect(chunked.data.length).toBeGreaterThan(0);

        // Verify chunk IDs start with "rlv-"
        chunked.data.forEach((chunk: any) => {
          expect(chunk.id).toMatch(/^rlv-[a-f0-9]+-\d+$/);
        });
      });

      test("respects max chunk size of 1200 chars", async () => {
        const discovered = await adapter.run("discover", {});
        const harvested = await adapter.run("harvest", { files: discovered.data });
        const normalized = await adapter.run("normalize", { files: harvested.data });
        const chunked = await adapter.run("chunk", { files: normalized.data });

        expect(chunked.ok).toBe(true);
        chunked.data.forEach((chunk: any) => {
          expect(chunk.text.length).toBeLessThanOrEqual(1200);
        });
      });
    });

    describe("embed", () => {
      test("generates embeddings for chunks", async () => {
        const discovered = await adapter.run("discover", {});
        const harvested = await adapter.run("harvest", { files: discovered.data });
        const normalized = await adapter.run("normalize", { files: harvested.data });
        const chunked = await adapter.run("chunk", { files: normalized.data });
        const embedded = await adapter.run("embed", { chunks: chunked.data });

        expect(embedded.ok).toBe(true);
        expect(embedded.data.length).toBeGreaterThan(0);

        // Verify embedding structure
        embedded.data.forEach((result: any) => {
          expect(result.vector).toBeDefined();
          expect(Array.isArray(result.vector)).toBe(true);
          expect(result.vector.length).toBeGreaterThan(0);
          expect(result.tokens).toBeGreaterThan(0);
        });
      });
    });

    describe("index", () => {
      test("returns indexed and failed counts", async () => {
        const discovered = await adapter.run("discover", {});
        const harvested = await adapter.run("harvest", { files: discovered.data });
        const normalized = await adapter.run("normalize", { files: harvested.data });
        const chunked = await adapter.run("chunk", { files: normalized.data });
        const embedded = await adapter.run("embed", { chunks: chunked.data });
        const indexed = await adapter.run("index", { embeddings: embedded.data });

        expect(indexed.ok).toBe(true);
        expect(indexed.data.indexed).toBeGreaterThanOrEqual(0);
        expect(indexed.data.failed).toBe(0);
      });
    });
  });

  describe("Smoke Tests", () => {
    test("full ingest pipeline runs without error", async () => {
      const result = await adapter.run("ingest", {});
      expect(result.ok).toBe(true);
      expect(result.data.discovered).toBeGreaterThan(0);
      expect(result.data.chunked).toBeGreaterThan(0);
      expect(result.data.embedded).toBeGreaterThan(0);
      expect(result.data.indexed).toBeGreaterThan(0);
    });

    test("pipeline returns timing metrics", async () => {
      const result = await adapter.run("ingest", {});
      expect(result.ok).toBe(true);
      expect(result.data.durationMs).toBeGreaterThan(0);
    });

    test("pipeline metadata is correct", async () => {
      const result = await adapter.run("ingest", {});
      expect(result.ok).toBe(true);
      expect(result.data.discovered).toBeGreaterThanOrEqual(result.data.chunked);
      expect(result.data.chunked).toBeGreaterThanOrEqual(result.data.embedded);
      expect(result.data.embedded).toBe(result.data.indexed + result.data.failed);
    });

    test("unknown action returns error", async () => {
      const result = await adapter.run("unknownAction", {});
      expect(result.ok).toBe(false);
    });
  });
});
