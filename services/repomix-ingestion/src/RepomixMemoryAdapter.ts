// Repomix Memory Adapter (Phase 4.4)
// Converts Repomix output to MemoryStore events

import { v4 as uuid } from 'uuid';
import { RepomixOutput } from './RepomixClient';

export interface MemoryEvent {
  id: string;
  type: string;
  agentId: string;
  timestamp: string;
  correlationId: string;
  payload: unknown;
  signals?: any[];
  metadata?: Record<string, any>;
}

export class RepomixMemoryAdapter {
  static toMemoryEvents(repoPath: string, repomixOutput: RepomixOutput): MemoryEvent[] {
    const correlationId = uuid();
    const timestamp = new Date().toISOString();

    return [
      {
        id: uuid(),
        type: 'REPO_SUMMARY',
        agentId: 'repomix',
        timestamp,
        correlationId,
        payload: {
          repoPath,
          summary: repomixOutput.summary || 'No summary available',
          statistics: repomixOutput.statistics || {},
        },
        metadata: { tags: ['repo', 'summary'] },
      },
      {
        id: uuid(),
        type: 'REPO_STRUCTURE',
        agentId: 'repomix',
        timestamp,
        correlationId,
        payload: {
          repoPath,
          tree: repomixOutput.tree || 'tree not available',
          fileCount: repomixOutput.files ? repomixOutput.files.length : 0,
        },
        metadata: { tags: ['repo', 'structure'] },
      },
      {
        id: uuid(),
        type: 'REPO_METRICS',
        agentId: 'repomix',
        timestamp,
        correlationId,
        payload: {
          repoPath,
          metrics: repomixOutput.metrics || {},
        },
        signals: [
          { type: 'repo_health', value: this.calculateHealth(repomixOutput) },
        ],
        metadata: { tags: ['repo', 'metrics'] },
      },
    ];
  }

  private static calculateHealth(output: RepomixOutput): number {
    // Simple health score based on available metrics
    if (!output.metrics) return 0.5;

    let score = 0.5;
    if (output.summary) score += 0.15;
    if (output.tree) score += 0.15;
    if (output.statistics) score += 0.2;

    return Math.min(score, 1.0);
  }
}
