import { XaiMcpClient } from "./client";
import { normalizePage } from "./normalize";
import { chunkMarkdown } from "../../shared/utils/chunking";
import { embedChunks } from "../../shared/utils/embedding";
import { indexChunks, ChunkRecord } from "../../shared/utils/indexing";
import { getTorqueQueryServerSync } from "../../server/TorqueQueryServer";

export async function ingestXaiDoc(slug: string): Promise<{ id: string; slug: string; chunkCount: number }> {
  const client = new XaiMcpClient();
  const db = getTorqueQueryServerSync().getDb();

  // 1. Fetch raw page
  const raw = await client.getPage(slug);
  const page = normalizePage(raw);

  if (!page.slug || !page.content) {
    throw new Error(`Invalid or empty document page returned for slug: ${slug}`);
  }

  // 2. Chunk markdown
  const textChunks = chunkMarkdown(page.content);
  const chunks = textChunks.map((text, i) => ({
    id: `xai:${page.slug}:chunk:${i}`,
    docId: `xai:${page.slug}`,
    chunkIndex: i,
    text,
    source: "xai-docs-mcp",
    url: page.url || null,
    lineage: raw.lineage,
  }));

  // 3. Generate deterministic embeddings
  const embeddings = await embedChunks(chunks);

  // 4. Combine into final ChunkRecord
  const chunkRecords: ChunkRecord[] = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  // 5. Index chunks into SQLite database
  await indexChunks(db, chunkRecords);

  return {
    id: `xai:${page.slug}`,
    slug: page.slug,
    chunkCount: chunkRecords.length,
  };
}
