// src/adapters/RLVaultAdapter.ts
/**
 * RLVaultAdapter
 * Ingests Rewrite Labs reference vault into TorqueQuery vector index.
 * 6-stage pipeline: discover → harvest → normalize → chunk → embed → index
 */

import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { adapterLogger } from "../logging/adapterLogger";
import { metricsExporter } from "../metrics/MetricsExporter";
import { makeSuccess, makeError, AdapterResponse } from "../validation/envelope";

interface VaultFile {
  path: string;
  section: string;
  frontmatter?: Record<string, any>;
  content: string;
}

interface Chunk {
  id: string;
  path: string;
  section: string;
  index: number;
  text: string;
  metadata: Record<string, any>;
}

interface EmbeddingResult {
  chunk: Chunk;
  vector: number[];
  tokens: number;
}

export class RLVaultAdapter {
  private vaultPath: string;
  private manifestPath: string;
  private manifest: any;

  constructor(vaultPath: string = "C:\\dev\\rl-ref", manifestPath: string = "C:\\dev\\docs\\rewrite-labs\\rl-vault-manifest.json") {
    this.vaultPath = vaultPath;
    this.manifestPath = manifestPath;
    this.manifest = this.loadManifest();
  }

  async run(action: string, payload: any): Promise<AdapterResponse<any>> {
    const startTime = Date.now();
    try {
      let data: any;

      switch (action) {
        case "discover":
          data = await this.discover();
          break;
        case "harvest":
          data = await this.harvest(payload.files);
          break;
        case "normalize":
          data = await this.normalize(payload.files);
          break;
        case "chunk":
          data = await this.chunk(payload.files);
          break;
        case "embed":
          data = await this.embed(payload.chunks);
          break;
        case "index":
          data = await this.index(payload.embeddings);
          break;
        case "ingest":
          // Full pipeline: discover → harvest → normalize → chunk → embed → index
          data = await this.runFullPipeline();
          break;
        default:
          throw new Error(`Unknown RLVaultAdapter action: ${action}`);
      }

      return makeSuccess(data, "RLVaultAdapter", startTime);
    } catch (err: any) {
      adapterLogger.error({ adapter: "rl-vault", action, error: err });
      return makeError("INGESTION_FAILED", { reason: err.message }, "RLVaultAdapter", startTime) as any;
    }
  }

  /**
   * Stage 1: Discover
   * Scan vault and verify against manifest.
   */
  private async discover(): Promise<VaultFile[]> {
    adapterLogger.info({ adapter: "rl-vault", stage: "discover" });
    metricsExporter.increment("rl_vault_discover_total");

    const files: VaultFile[] = [];
    const missing: string[] = [];

    for (const section of this.manifest.sections) {
      for (const rel of section.include) {
        const fullPath = path.join(this.vaultPath, rel);
        const absolutePath = path.resolve(fullPath);

        if (!fs.existsSync(absolutePath)) {
          missing.push(rel);
          continue;
        }

        files.push({
          path: absolutePath,
          section: section.name,
          content: "", // Will be populated in harvest
        });
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing vault files: ${missing.join(", ")}`);
    }

    adapterLogger.info({ adapter: "rl-vault", stage: "discover", filesFound: files.length });
    metricsExporter.observe("rl_vault_files_discovered", files.length);

    return files;
  }

  /**
   * Stage 2: Harvest
   * Read files with UTF-8, extract frontmatter, infer titles.
   */
  private async harvest(files: VaultFile[]): Promise<VaultFile[]> {
    adapterLogger.info({ adapter: "rl-vault", stage: "harvest", fileCount: files.length });
    metricsExporter.increment("rl_vault_harvest_total");

    const harvested: VaultFile[] = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(file.path, "utf-8");

        // Extract YAML frontmatter
        let frontmatter: Record<string, any> = {};
        let content = raw;

        const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (fmMatch) {
          try {
            // Simple YAML parse (minimal—no nested structures expected)
            const fmLines = fmMatch[1].split("\n");
            for (const line of fmLines) {
              const [key, ...valueParts] = line.split(":");
              if (key && valueParts.length > 0) {
                frontmatter[key.trim()] = valueParts.join(":").trim();
              }
            }
            content = fmMatch[2];
          } catch {
            // Ignore parse errors; use raw content
          }
        }

        // Infer title from H1 if missing
        if (!frontmatter.title) {
          const h1Match = content.match(/^#\s+(.+)$/m);
          if (h1Match) {
            frontmatter.title = h1Match[1].trim();
          }
        }

        harvested.push({
          ...file,
          content,
          frontmatter,
        });
      } catch (err) {
        adapterLogger.error({ adapter: "rl-vault", stage: "harvest", file: file.path, error: err });
        throw err;
      }
    }

    adapterLogger.info({ adapter: "rl-vault", stage: "harvest", harvested: harvested.length });
    return harvested;
  }

  /**
   * Stage 3: Normalize
   * Apply CIC normalization: strip HTML comments (except SYNC), normalize headings, resolve links.
   */
  private async normalize(files: VaultFile[]): Promise<VaultFile[]> {
    adapterLogger.info({ adapter: "rl-vault", stage: "normalize", fileCount: files.length });
    metricsExporter.increment("rl_vault_normalize_total");

    const normalized: VaultFile[] = [];

    for (const file of files) {
      let content = file.content;

      // Strip HTML comments except SYNC markers
      content = content.replace(/<!--(?![\s\S]*?SYNC)[\s\S]*?-->/g, "");

      // Normalize tabs → 2 spaces
      content = content.replace(/\t/g, "  ");

      // Normalize headings: ensure single # for H1
      content = content.replace(/^(#+)\s+/gm, (match, hashes) => {
        const level = hashes.length;
        return "#".repeat(level) + " ";
      });

      // Resolve relative links to absolute vault paths (if needed in future)
      // For now, just log that links are present
      const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
      if (linkCount > 0) {
        adapterLogger.debug({ adapter: "rl-vault", stage: "normalize", file: file.path, linksFound: linkCount });
      }

      normalized.push({
        ...file,
        content,
      });
    }

    adapterLogger.info({ adapter: "rl-vault", stage: "normalize", normalized: normalized.length });
    return normalized;
  }

  /**
   * Stage 4: Chunk
   * Deterministic chunking: max 1200 chars, 120 char overlap.
   * Chunk IDs: rlv-{sha256-of-path}-{index}
   */
  private async chunk(files: VaultFile[]): Promise<Chunk[]> {
    adapterLogger.info({ adapter: "rl-vault", stage: "chunk", fileCount: files.length });
    metricsExporter.increment("rl_vault_chunk_total");

    const MAX_CHUNK_SIZE = 1200;
    const OVERLAP_SIZE = 120;
    const chunks: Chunk[] = [];

    for (const file of files) {
      const content = file.content;
      const hash = createHash("sha256")
        .update(file.path)
        .digest("hex")
        .substring(0, 16);

      let index = 0;
      let pos = 0;

      while (pos < content.length) {
        const chunkText = content.substring(pos, Math.min(pos + MAX_CHUNK_SIZE, content.length));
        const chunkId = `rlv-${hash}-${index}`;

        chunks.push({
          id: chunkId,
          path: file.path,
          section: file.section,
          index,
          text: chunkText,
          metadata: {
            source: "rl-vault",
            path: file.path,
            section: file.section,
            title: file.frontmatter?.title || "Untitled",
            chunkIndex: index,
          },
        });

        // Move position forward, accounting for overlap
        pos += MAX_CHUNK_SIZE - OVERLAP_SIZE;
        index++;
      }
    }

    adapterLogger.info({ adapter: "rl-vault", stage: "chunk", chunksProduced: chunks.length });
    metricsExporter.observe("rl_vault_chunks_produced", chunks.length);

    return chunks;
  }

  /**
   * Stage 5: Embed
   * Use CIC's embedding pipeline (stub for now).
   * Real implementation would call TorqueQuery's embedding service.
   */
  private async embed(chunks: Chunk[]): Promise<EmbeddingResult[]> {
    adapterLogger.info({ adapter: "rl-vault", stage: "embed", chunkCount: chunks.length });
    metricsExporter.increment("rl_vault_embed_total");

    // Stub: return mock embeddings (in production, call actual embedding service)
    const embeddings: EmbeddingResult[] = [];

    for (const chunk of chunks) {
      // Deterministic mock embedding based on chunk ID
      const seed = parseInt(createHash("md5").update(chunk.id).digest("hex").substring(0, 8), 16);
      const mockVector = Array.from({ length: 384 }, (_, i) =>
        Math.sin((seed + i) / 100) * Math.cos((seed - i) / 100)
      );

      embeddings.push({
        chunk,
        vector: mockVector,
        tokens: Math.ceil(chunk.text.length / 4), // Rough token estimate
      });
    }

    adapterLogger.info({ adapter: "rl-vault", stage: "embed", embeddingsProduced: embeddings.length });
    return embeddings;
  }

  /**
   * Stage 6: Index
   * Push into TorqueQuery (stub for now).
   * Real implementation would call Qdrant vector index.
   */
  private async index(embeddings: EmbeddingResult[]): Promise<{ indexed: number; failed: number }> {
    adapterLogger.info({ adapter: "rl-vault", stage: "index", embeddingCount: embeddings.length });
    metricsExporter.increment("rl_vault_index_total");

    // Stub: in production, push to Qdrant with:
    // - collection: "rl-vault"
    // - vectors + metadata
    // - deterministic IDs

    let indexed = 0;
    let failed = 0;

    for (const result of embeddings) {
      try {
        // Mock indexing logic
        adapterLogger.debug({ adapter: "rl-vault", stage: "index", chunkId: result.chunk.id });
        indexed++;
      } catch (err) {
        adapterLogger.error({ adapter: "rl-vault", stage: "index", chunkId: result.chunk.id, error: err });
        failed++;
      }
    }

    adapterLogger.info({ adapter: "rl-vault", stage: "index", indexed, failed });
    metricsExporter.observe("rl_vault_indexed", indexed);
    metricsExporter.observe("rl_vault_index_failed", failed);

    return { indexed, failed };
  }

  /**
   * Full pipeline orchestration
   */
  private async runFullPipeline(): Promise<any> {
    adapterLogger.info({ adapter: "rl-vault", pipeline: "start" });
    const pipelineStart = Date.now();

    const discovered = await this.discover();
    const harvested = await this.harvest(discovered);
    const normalized = await this.normalize(harvested);
    const chunked = await this.chunk(normalized);
    const embedded = await this.embed(chunked);
    const indexed = await this.index(embedded);

    const duration = Date.now() - pipelineStart;
    adapterLogger.info({
      adapter: "rl-vault",
      pipeline: "complete",
      discovered: discovered.length,
      chunked: chunked.length,
      embedded: embedded.length,
      indexed: indexed.indexed,
      durationMs: duration,
    });

    metricsExporter.observe("rl_vault_pipeline_duration_ms", duration);

    return {
      stage: "ingest",
      discovered: discovered.length,
      chunked: chunked.length,
      embedded: embedded.length,
      indexed: indexed.indexed,
      failed: indexed.failed,
      durationMs: duration,
    };
  }

  private loadManifest(): any {
    if (!fs.existsSync(this.manifestPath)) {
      throw new Error(`Manifest not found: ${this.manifestPath}`);
    }
    return JSON.parse(fs.readFileSync(this.manifestPath, "utf-8"));
  }
}
