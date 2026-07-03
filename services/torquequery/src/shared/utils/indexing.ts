import Database from 'better-sqlite3';

export interface ChunkRecord {
  id: string;
  docId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  source: string;
  url?: string | null;
  lineage?: any;
}

export async function indexChunks(db: Database.Database, chunks: ChunkRecord[]): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO document_chunks (id, doc_id, chunk_index, text, embedding, source, url, lineage, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      text = EXCLUDED.text,
      embedding = EXCLUDED.embedding,
      lineage = EXCLUDED.lineage,
      createdAt = EXCLUDED.createdAt
  `);

  const transaction = db.transaction((records: ChunkRecord[]) => {
    for (const record of records) {
      stmt.run(
        record.id,
        record.docId,
        record.chunkIndex,
        record.text,
        JSON.stringify(record.embedding),
        record.source,
        record.url || null,
        record.lineage ? JSON.stringify(record.lineage) : null,
        new Date().toISOString()
      );
    }
  });

  transaction(chunks);
}
