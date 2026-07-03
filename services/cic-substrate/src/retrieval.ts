import { query } from './db';

export interface HybridSearchOptions {
  namespace: string;
  query: string;
  embedding?: number[];
  max_results?: number;
}

export async function searchHybrid(options: HybridSearchOptions) {
  const { namespace, query: textQuery, embedding, max_results = 10 } = options;

  let sql = '';
  let params: any[] = [];

  if (embedding && embedding.length > 0) {
    // Hybrid Search: BM25 + Vector + RRF
    sql = `
      WITH bm25_search AS (
        SELECT id, ts_rank_cd(body_tsv, websearch_to_tsquery('pg_catalog.english', $2)) AS bm25_score
        FROM tq_chunks
        WHERE namespace = $1 
          AND body_tsv @@ websearch_to_tsquery('pg_catalog.english', $2)
          AND deleted_at IS NULL
        ORDER BY bm25_score DESC
        LIMIT 100
      ),
      vector_search AS (
        SELECT c.id, 1 - (v.embedding <=> $3::vector) AS vector_score
        FROM tq_chunks c
        JOIN tq_vectors v ON c.id = v.chunk_id
        WHERE c.namespace = $1
          AND c.deleted_at IS NULL
        ORDER BY v.embedding <=> $3::vector
        LIMIT 100
      ),
      ranked_bm25 AS (
        SELECT id, bm25_score, row_number() OVER (ORDER BY bm25_score DESC) as rank
        FROM bm25_search
      ),
      ranked_vector AS (
        SELECT id, vector_score, row_number() OVER (ORDER BY vector_score DESC) as rank
        FROM vector_search
      ),
      fused AS (
        SELECT 
          COALESCE(b.id, v.id) as chunk_id,
          COALESCE(b.bm25_score, 0) as bm25_score,
          COALESCE(v.vector_score, 0) as vector_score,
          (COALESCE(1.0 / (60 + b.rank), 0.0) + COALESCE(1.0 / (60 + v.rank), 0.0)) as fused_score
        FROM ranked_bm25 b
        FULL OUTER JOIN ranked_vector v ON b.id = v.id
      )
      SELECT 
        c.*, 
        f.fused_score,
        f.bm25_score,
        f.vector_score
      FROM fused f
      JOIN tq_chunks c ON f.chunk_id = c.id
      ORDER BY f.fused_score DESC
      LIMIT $4;
    `;
    params = [namespace, textQuery, `[${embedding.join(',')}]`, max_results];
  } else {
    // Fallback: BM25 only
    sql = `
      SELECT 
        c.*,
        ts_rank_cd(c.body_tsv, websearch_to_tsquery('pg_catalog.english', $2)) AS bm25_score,
        0 as vector_score,
        ts_rank_cd(c.body_tsv, websearch_to_tsquery('pg_catalog.english', $2)) AS fused_score
      FROM tq_chunks c
      WHERE c.namespace = $1 
        AND c.body_tsv @@ websearch_to_tsquery('pg_catalog.english', $2)
        AND c.deleted_at IS NULL
      ORDER BY bm25_score DESC
      LIMIT $3;
    `;
    params = [namespace, textQuery, max_results];
  }

  const result = await query(sql, params);
  
  // Exclude tsvector from final output for cleaner JSON
  return result.rows.map(row => {
    const { body_tsv, ...rest } = row;
    return rest;
  });
}
