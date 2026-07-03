import { v4 as uuidv4 } from 'uuid';
import { query } from './db';
import { applyGovernance, ChunkInput } from './governance';

// Optional: Type for raw capture data before normalization
export interface RawData {
  namespace: string;
  type: any;
  title?: string;
  body?: string;
  tags?: string[];
  importance?: number;
  ttl_days?: number | null;
  source: string;
  [key: string]: any;
}

export async function processIngestion(data: RawData, embedding?: number[]) {
  const captured = capture(data);
  const normalized = normalize(captured);
  const classified = classify(normalized);
  const enriched = enrich(classified);
  const finalChunk = applyGovernance(enriched);
  return await persist(finalChunk, embedding);
}

// 1. Capture
function capture(data: any): RawData {
  // In a real system, this might fetch from a queue or external source
  return data as RawData;
}

// 2. Normalize
function normalize(data: RawData): ChunkInput {
  // Extract and standardize fields
  const { source, namespace, type, title, body, tags, importance, ttl_days, ...rest } = data;
  return {
    namespace,
    type,
    title: title?.trim() || '',
    body: body?.trim() || '',
    tags: tags || [],
    importance,
    ttl_days,
    provenance: {
      source,
      ...rest
    }
  };
}

// 3. Classify
function classify(chunk: ChunkInput): ChunkInput {
  // Ensure type is uppercase or determine from content if necessary
  if (typeof chunk.type === 'string') {
    chunk.type = chunk.type.toUpperCase() as any;
  }
  return chunk;
}

// 4. Enrich
function enrich(chunk: ChunkInput): ChunkInput {
  // Add inferred tags, analyze sentiment, etc.
  if (chunk.body) {
    if (!chunk.tags) chunk.tags = [];
    if (chunk.body.toLowerCase().includes('error')) {
      if (!chunk.tags.includes('error')) chunk.tags.push('error');
    }
  }
  return chunk;
}

// 5. Persist
async function persist(chunk: ChunkInput, embedding?: number[]) {
  const id = uuidv4();
  
  const insertChunkQuery = `
    INSERT INTO tq_chunks (
      id, namespace, type, title, body, tags, importance, ttl_days, provenance
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    ) RETURNING *;
  `;
  
  const values = [
    id,
    chunk.namespace,
    chunk.type,
    chunk.title,
    chunk.body,
    chunk.tags,
    chunk.importance,
    chunk.ttl_days,
    JSON.stringify(chunk.provenance)
  ];

  // We could do a transaction here
  const res = await query(insertChunkQuery, values);
  const savedChunk = res.rows[0];

  if (embedding && embedding.length === 1536) {
    const insertVectorQuery = `
      INSERT INTO tq_vectors (chunk_id, embedding)
      VALUES ($1, $2)
    `;
    await query(insertVectorQuery, [id, `[${embedding.join(',')}]`]);
  }

  return { ...savedChunk, has_embedding: !!embedding };
}
