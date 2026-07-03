// Repomix Pipeline (Phase 4.4)
// Orchestrates repo → Repomix → MemoryStore flow

import axios from 'axios';
import { RepomixClient } from './RepomixClient';
import { RepomixMemoryAdapter, MemoryEvent } from './RepomixMemoryAdapter';

export class RepomixPipeline {
  private memoryUrl = process.env.MEMORY_BASE_URL || 'http://localhost:3100';
  private client: RepomixClient;

  constructor(repomixPath?: string) {
    this.client = new RepomixClient(repomixPath);
  }

  async ingest(repoPath: string): Promise<MemoryEvent[]> {
    // Step 1: Analyze repo with Repomix
    const output = await this.client.analyzeRepo(repoPath);

    // Step 2: Convert to memory events
    const events = RepomixMemoryAdapter.toMemoryEvents(repoPath, output);

    // Step 3: Send to MemoryStore
    for (const event of events) {
      try {
        await axios.post(`${this.memoryUrl}/api/memory/append`, event, {
          timeout: 5000,
        });
      } catch (error) {
        console.error(`Failed to append memory event for ${repoPath}:`, error);
        throw error;
      }
    }

    return events;
  }

  async ingestBatch(repoPaths: string[]): Promise<MemoryEvent[][]> {
    const results: MemoryEvent[][] = [];

    for (const repoPath of repoPaths) {
      try {
        const events = await this.ingest(repoPath);
        results.push(events);
      } catch (error) {
        console.error(`Failed to ingest ${repoPath}:`, error);
      }
    }

    return results;
  }
}
