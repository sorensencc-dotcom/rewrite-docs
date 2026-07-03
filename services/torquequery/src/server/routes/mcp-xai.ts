import { Router, Request, Response } from "express";
import { XaiMcpClient } from "../../ingest/xai/client";
import { normalizeSearch } from "../../ingest/xai/normalize";
import { ingestXaiDoc } from "../../ingest/xai/ingest";
import { Logger } from "../../shared/utils/logger";

export const mcpXaiRouter = Router();
const logger = new Logger("mcpXaiRouter");

/**
 * POST /mcp/xai/search
 * Body: { query: string, maxResults?: number }
 */
mcpXaiRouter.post("/search", async (req: Request, res: Response) => {
  const query = String(req.body?.query ?? "").trim();
  const maxResults = Number(req.body?.maxResults ?? 10);

  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  const client = new XaiMcpClient();
  try {
    const raw = await client.search(query, maxResults);
    const items = normalizeSearch(raw);

    const lineage = {
      source: "xai-docs-mcp",
      method: "search_docs",
      requestId: raw.lineage.requestId,
      attempt: raw.lineage.attempt,
    };

    return res.json({ items, lineage });
  } catch (err: any) {
    logger.error("xAI MCP Search failed", { error: err.message });
    return res.status(502).json({
      error: "xai_mcp_search_failed",
      message: err?.message ?? String(err),
    });
  }
});

/**
 * POST /mcp/xai/ingest
 * Body: { slug?: string, slugs?: string[] }
 */
mcpXaiRouter.post("/ingest", async (req: Request, res: Response) => {
  const slug = req.body?.slug as string | undefined;
  const slugs = (req.body?.slugs as string[] | undefined) ?? (slug ? [slug] : []);

  if (!slugs.length) {
    return res.status(400).json({ error: "slug or slugs[] is required" });
  }

  const docs: Array<{ id: string; slug: string; chunkCount: number }> = [];
  let totalChunks = 0;
  const ingestionJobId = `xai-mcp-ingest-${Date.now()}`;

  try {
    for (const s of slugs) {
      const result = await ingestXaiDoc(s);
      totalChunks += result.chunkCount;
      docs.push({ id: result.id, slug: s, chunkCount: result.chunkCount });
    }

    return res.json({
      docs,
      chunkCount: totalChunks,
      lineage: {
        source: "xai-docs-mcp",
        ingestionJobId,
        docCount: docs.length,
        chunkCount: totalChunks,
      },
    });
  } catch (err: any) {
    logger.error("xAI MCP Ingest failed", { error: err.message });
    return res.status(502).json({
      error: "xai_mcp_ingest_failed",
      message: err?.message ?? String(err),
    });
  }
});
