/**
 * HTTP Client for Repomix Service
 * Proxies calls to repomix-ingestion microservice
 */

export interface MemoryEvent {
  id: string;
  type: string;
  timestamp: number;
  payload: unknown;
}

export class RepomixServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async ingest(repoPath: string): Promise<MemoryEvent[]> {
    const res = await fetch(`${this.baseUrl}/repomix/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath }),
    });
    if (!res.ok) throw new Error(`Repomix service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async ingestBatch(repoPaths: string[]): Promise<MemoryEvent[][]> {
    const res = await fetch(`${this.baseUrl}/repomix/ingest-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPaths }),
    });
    if (!res.ok) throw new Error(`Repomix service error: ${res.status}`);
    return (await res.json()) as any;
  }
}
