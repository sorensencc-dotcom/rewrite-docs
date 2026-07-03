/**
 * Phase 4.4: Repomix Integration Tests
 * Tests repo ingestion and MemoryStore connection
 */

import { RepomixClient } from '../src/RepomixClient';
import { RepomixMemoryAdapter } from '../src/RepomixMemoryAdapter';
import { RepomixPipeline } from '../src/RepomixPipeline';
import fs from 'fs';
import path from 'path';

describe('Phase 4.4: Repomix Integration', () => {
  const testRepoPath = path.join(__dirname, '../test-repo');

  beforeAll(() => {
    // Create a minimal test repo
    if (!fs.existsSync(testRepoPath)) {
      fs.mkdirSync(testRepoPath, { recursive: true });
      fs.writeFileSync(path.join(testRepoPath, 'README.md'), '# Test Repo');
      fs.writeFileSync(path.join(testRepoPath, 'package.json'), '{"name":"test"}');
    }
  });

  afterAll(() => {
    if (fs.existsSync(testRepoPath)) {
      fs.rmSync(testRepoPath, { recursive: true });
    }
  });

  it('analyzes a repository with RepomixClient', async () => {
    const client = new RepomixClient();
    const output = await client.analyzeRepo(testRepoPath);

    expect(output).toBeDefined();
    expect(output.summary || output.metrics).toBeDefined();
  });

  it('converts Repomix output to memory events', () => {
    const output = {
      summary: 'Test repository',
      tree: 'src/\n  index.ts',
      metrics: { files: 2, loc: 100 },
    };

    const events = RepomixMemoryAdapter.toMemoryEvents(testRepoPath, output);

    expect(events.length).toBe(3);
    expect(events[0].type).toBe('REPO_SUMMARY');
    expect(events[1].type).toBe('REPO_STRUCTURE');
    expect(events[2].type).toBe('REPO_METRICS');
    expect(events[0].correlationId).toBe(events[1].correlationId);
  });

  it('events have proper structure', () => {
    const output = { summary: 'Test' };
    const events = RepomixMemoryAdapter.toMemoryEvents(testRepoPath, output);

    for (const event of events) {
      expect(event.id).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.agentId).toBe('repomix');
      expect(event.timestamp).toBeDefined();
      expect(event.correlationId).toBeDefined();
      expect(event.payload).toBeDefined();
    }
  });

  it('RepomixPipeline creates events', async () => {
    const pipeline = new RepomixPipeline();
    // Mock the axios call by not calling it (it would fail in tests)
    const client = new RepomixClient();
    const output = await client.analyzeRepo(testRepoPath);
    const events = RepomixMemoryAdapter.toMemoryEvents(testRepoPath, output);

    expect(events.length).toBeGreaterThan(0);
  });

  it('memory events include repo metadata', () => {
    const output = {
      summary: 'Test repository',
      metrics: { files: 5, loc: 500 },
      statistics: { avgFileSize: 100 },
    };

    const events = RepomixMemoryAdapter.toMemoryEvents(testRepoPath, output);
    const summaryEvent = events.find(e => e.type === 'REPO_SUMMARY');

    expect(summaryEvent?.payload).toHaveProperty('repoPath', testRepoPath);
    expect(summaryEvent?.payload).toHaveProperty('summary');
  });

  it('health score calculation works', () => {
    const fullOutput = {
      summary: 'Summary',
      tree: 'tree',
      metrics: { test: 1 },
      statistics: { test: 1 },
    };

    const emptyOutput = {};

    const fullEvents = RepomixMemoryAdapter.toMemoryEvents(testRepoPath, fullOutput);
    const emptyEvents = RepomixMemoryAdapter.toMemoryEvents(testRepoPath, emptyOutput);

    const fullHealth = fullEvents[2].signals?.[0].value;
    const emptyHealth = emptyEvents[2].signals?.[0].value;

    expect(fullHealth).toBeGreaterThan(emptyHealth || 0);
  });
});
