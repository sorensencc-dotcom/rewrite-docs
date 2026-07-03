/**
 * Phase 26: TorqueQuery Integration Tests
 * Tests indexing, querying, and memory → index pipeline
 */

import { TorqueQueryServer, MemoryIndexer, MemoryQueries } from '../src/index';
import fs from 'fs';
import path from 'path';

describe('Phase 26: TorqueQuery Integration', () => {
  let server: TorqueQueryServer;
  let indexer: MemoryIndexer;
  let queries: MemoryQueries;
  const testDbPath = path.join(__dirname, '../db/test-torque.db');

  beforeAll(async () => {
    server = new TorqueQueryServer(testDbPath);
    await server.init();
    indexer = server.getIndexer();
    queries = server.getQueries();
  });

  afterAll(() => {
    server.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('indexes memory event', () => {
    const event = {
      id: 'evt-1',
      type: 'TEST_EVENT',
      agentId: 'agent-1',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-1',
      payload: { foo: 'bar' },
    };

    expect(() => {
      indexer.indexEvent(event);
    }).not.toThrow();
  });

  it('queries events by type', () => {
    indexer.indexEvent({
      id: 'evt-2',
      type: 'TYPE_A',
      agentId: 'agent-1',
      timestamp: new Date().toISOString(),
      payload: { data: 'test' },
    });

    const results = queries.byType('TYPE_A');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('TYPE_A');
  });

  it('queries events by agent', () => {
    indexer.indexEvent({
      id: 'evt-3',
      type: 'TYPE_B',
      agentId: 'agent-test',
      timestamp: new Date().toISOString(),
      payload: { agent: 'data' },
    });

    const results = queries.byAgent('agent-test');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].agentId).toBe('agent-test');
  });

  it('queries events by correlation', () => {
    indexer.indexEvent({
      id: 'evt-4',
      type: 'TYPE_C',
      agentId: 'agent-2',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-test',
      payload: { correlation: 'test' },
    });

    const results = queries.byCorrelation('corr-test');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].correlationId).toBe('corr-test');
  });

  it('indexes signals with events', () => {
    indexer.indexEvent({
      id: 'evt-5',
      type: 'TYPE_WITH_SIGNALS',
      agentId: 'agent-3',
      timestamp: new Date().toISOString(),
      signals: [
        { type: 'confidence', value: 0.95 },
        { type: 'drift', value: 0.05 },
      ],
      payload: {},
    });

    const signals = queries.bySignal('confidence');
    expect(signals.length).toBeGreaterThan(0);
  });

  it('maintains agent timeline', () => {
    const agentId = 'timeline-agent';
    indexer.indexEvent({
      id: 'evt-6',
      type: 'TIMELINE_EVENT',
      agentId,
      timestamp: new Date(Date.now() - 1000).toISOString(),
      payload: {},
    });

    indexer.indexEvent({
      id: 'evt-7',
      type: 'TIMELINE_EVENT',
      agentId,
      timestamp: new Date().toISOString(),
      payload: {},
    });

    const timeline = queries.agentTimeline(agentId);
    expect(timeline.length).toBeGreaterThanOrEqual(2);
    expect(timeline[0].sequence).toBeLessThan(timeline[1].sequence);
  });

  it('counts events by type', () => {
    indexer.indexEvent({
      id: 'evt-8',
      type: 'COUNT_TEST',
      agentId: 'agent-4',
      timestamp: new Date().toISOString(),
      payload: {},
    });

    const count = queries.countByType('COUNT_TEST');
    expect(count).toBeGreaterThan(0);
  });

  it('counts events by agent', () => {
    const agentId = 'count-agent';
    indexer.indexEvent({
      id: 'evt-9',
      type: 'COUNT_TEST_2',
      agentId,
      timestamp: new Date().toISOString(),
      payload: {},
    });

    const count = queries.countByAgent(agentId);
    expect(count).toBeGreaterThan(0);
  });

  it('indexes governance history', () => {
    expect(() => {
      indexer.indexGovernanceHistory('prop-1', 5, 'approved');
    }).not.toThrow();

    const history = queries.governanceHistory('prop-1');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].proposalId).toBe('prop-1');
  });

  it('fetches latest events by agent', () => {
    const agentId = 'latest-agent';
    for (let i = 0; i < 15; i++) {
      indexer.indexEvent({
        id: `evt-latest-${i}`,
        type: 'LATEST_TEST',
        agentId,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        payload: { index: i },
      });
    }

    const latest = queries.latestByAgent(agentId, 10);
    expect(latest.length).toBeLessThanOrEqual(10);
  });

  it('server is healthy', () => {
    expect(server.isHealthy()).toBe(true);
  });
});
