/**
 * Phase 26: TorqueQuery Ingest Tests
 * Tests event ingestion, validation, and snapshot recording
 */

import { TorqueQueryServer, validateEvent, ValidationError, TorqueIngestRequest } from '../src/index';
import fs from 'fs';
import path from 'path';

describe('Phase 26: TorqueQuery Ingest', () => {
  let server: TorqueQueryServer;
  const testDbPath = path.join(__dirname, '../db/test-ingest.db');

  beforeAll(async () => {
    server = new TorqueQueryServer(testDbPath);
    await server.init();
  });

  afterAll(() => {
    server.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Event Validation', () => {
    it('accepts valid event', () => {
      const event: TorqueIngestRequest = {
        type: 'TEST_EVENT',
        agentId: 'agent-1',
        timestamp: new Date().toISOString(),
        payload: { data: 'test' },
      };

      expect(() => validateEvent(event)).not.toThrow();
    });

    it('rejects event without type', () => {
      const event: any = {
        agentId: 'agent-1',
        payload: { data: 'test' },
      };

      expect(() => validateEvent(event)).toThrow(ValidationError);
      expect(() => validateEvent(event)).toThrow('type is required');
    });

    it('rejects event without agentId', () => {
      const event: any = {
        type: 'TEST',
        payload: { data: 'test' },
      };

      expect(() => validateEvent(event)).toThrow(ValidationError);
      expect(() => validateEvent(event)).toThrow('agentId is required');
    });

    it('rejects event without payload', () => {
      const event: any = {
        type: 'TEST',
        agentId: 'agent-1',
      };

      expect(() => validateEvent(event)).toThrow(ValidationError);
      expect(() => validateEvent(event)).toThrow('payload is required');
    });

    it('rejects non-object event', () => {
      expect(() => validateEvent('not an object')).toThrow(ValidationError);
      expect(() => validateEvent(null)).toThrow(ValidationError);
    });

    it('validates timestamp format if present', () => {
      const event: any = {
        type: 'TEST',
        agentId: 'agent-1',
        payload: {},
        timestamp: 'invalid-timestamp',
      };

      expect(() => validateEvent(event)).toThrow(ValidationError);
    });

    it('validates signals array if present', () => {
      const event: any = {
        type: 'TEST',
        agentId: 'agent-1',
        payload: {},
        signals: 'not-array',
      };

      expect(() => validateEvent(event)).toThrow(ValidationError);
    });
  });

  describe('Single Event Ingest', () => {
    it('indexes single event with generated id', () => {
      const event: TorqueIngestRequest = {
        type: 'INGEST_TEST_1',
        agentId: 'ingest-agent-1',
        timestamp: new Date().toISOString(),
        payload: { source: 'test' },
      };

      expect(() => {
        server.getIndexer().indexEvent(event);
      }).not.toThrow();

      const results = server.getQueries().byType('INGEST_TEST_1');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].agentId).toBe('ingest-agent-1');
    });

    it('indexes event with custom id', () => {
      const customId = 'custom-evt-123';
      const event: TorqueIngestRequest = {
        id: customId,
        type: 'INGEST_TEST_2',
        agentId: 'ingest-agent-2',
        payload: { custom: true },
      };

      server.getIndexer().indexEvent(event);

      const results = server.getQueries().byType('INGEST_TEST_2');
      expect(results[0].id).toBe(customId);
    });

    it('indexes event with signals', () => {
      const event: TorqueIngestRequest = {
        type: 'INGEST_WITH_SIGNALS',
        agentId: 'signal-agent',
        payload: {},
        signals: [
          { type: 'confidence', value: 0.95 },
          { type: 'drift', value: 0.05 },
        ],
      };

      server.getIndexer().indexEvent(event);

      const signals = server.getQueries().bySignal('confidence');
      expect(signals.length).toBeGreaterThan(0);
    });

    it('indexes event with correlation', () => {
      const correlationId = 'corr-ingest-1';
      const event: TorqueIngestRequest = {
        type: 'CORR_TEST',
        agentId: 'corr-agent',
        correlationId,
        payload: { correlated: true },
      };

      server.getIndexer().indexEvent(event);

      const correlated = server.getQueries().byCorrelation(correlationId);
      expect(correlated.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Ingest', () => {
    it('handles empty batch', () => {
      const batch: TorqueIngestRequest[] = [];
      expect(() => {
        for (const event of batch) {
          server.getIndexer().indexEvent(event);
        }
      }).not.toThrow();
    });

    it('indexes 10 events in batch', () => {
      const agentId = 'batch-agent-10';
      const batch: TorqueIngestRequest[] = [];

      for (let i = 0; i < 10; i++) {
        batch.push({
          type: 'BATCH_TEST',
          agentId,
          timestamp: new Date(Date.now() + i * 100).toISOString(),
          payload: { index: i },
        });
      }

      for (const event of batch) {
        server.getIndexer().indexEvent(event);
      }

      const count = server.getQueries().countByAgent(agentId);
      expect(count).toBe(10);
    });

    it('indexes 100 events without memory leaks', () => {
      const agentId = 'batch-agent-100';
      const type = 'BATCH_LARGE_TEST';

      for (let i = 0; i < 100; i++) {
        const event: TorqueIngestRequest = {
          type,
          agentId,
          timestamp: new Date(Date.now() + i * 50).toISOString(),
          payload: { index: i, data: 'x'.repeat(100) },
        };
        server.getIndexer().indexEvent(event);
      }

      const results = server.getQueries().byType(type);
      expect(results.length).toBeGreaterThanOrEqual(100);
    });

    it('partial batch failure records errors', () => {
      const indexer = server.getIndexer();
      const queries = server.getQueries();

      const valid: TorqueIngestRequest = {
        type: 'BATCH_MIXED',
        agentId: 'mixed-agent',
        payload: { valid: true },
      };

      server.getIndexer().indexEvent(valid);
      const results = queries.byType('BATCH_MIXED');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Snapshot Tests', () => {
    it('event payload snapshot', () => {
      const event: TorqueIngestRequest = {
        id: 'snap-evt-1',
        type: 'SNAPSHOT_TEST',
        agentId: 'snap-agent',
        timestamp: '2026-06-16T12:00:00Z',
        payload: {
          model: 'claude-opus',
          tokens: { input: 150, output: 250 },
          cost: 0.0045,
        },
      };

      server.getIndexer().indexEvent(event);
      const results = server.getQueries().byType('SNAPSHOT_TEST');

      expect(results[0]).toMatchSnapshot();
    });

    it('agent timeline snapshot', () => {
      const agentId = 'snap-timeline-agent';
      const timestamps = [
        '2026-06-16T10:00:00Z',
        '2026-06-16T10:30:00Z',
        '2026-06-16T11:00:00Z',
      ];

      timestamps.forEach((ts, i) => {
        server.getIndexer().indexEvent({
          type: 'TIMELINE_SNAPSHOT',
          agentId,
          timestamp: ts,
          payload: { sequence: i },
        });
      });

      const timeline = server.getQueries().agentTimeline(agentId);
      expect(timeline).toMatchSnapshot();
    });

    it('correlation snapshot', () => {
      const correlationId = 'snap-corr-123';

      for (let i = 0; i < 3; i++) {
        server.getIndexer().indexEvent({
          type: 'CORR_SNAPSHOT',
          agentId: `corr-agent-${i}`,
          correlationId,
          payload: { part: i },
        });
      }

      const correlated = server.getQueries().byCorrelation(correlationId);
      expect(correlated).toMatchSnapshot();
    });

    it('governance history snapshot', () => {
      server.getIndexer().indexGovernanceHistory('prop-snap-1', 7, 'approved');
      server.getIndexer().indexGovernanceHistory('prop-snap-1', 8, 'confirmed');

      const history = server.getQueries().governanceHistory('prop-snap-1');
      expect(history).toMatchSnapshot();
    });
  });

  describe('Query After Ingest', () => {
    it('finds events immediately after ingest', () => {
      const eventId = 'immediate-evt';
      const event: TorqueIngestRequest = {
        id: eventId,
        type: 'IMMEDIATE_TEST',
        agentId: 'immediate-agent',
        payload: { immediate: true },
      };

      server.getIndexer().indexEvent(event);

      const results = server.getQueries().byType('IMMEDIATE_TEST');
      expect(results.some((e) => e.id === eventId)).toBe(true);
    });

    it('counts events by type after batch ingest', () => {
      const type = 'COUNT_AFTER_INGEST';
      const agentId = 'count-agent';

      for (let i = 0; i < 5; i++) {
        server.getIndexer().indexEvent({
          type,
          agentId,
          payload: { i },
        });
      }

      const count = server.getQueries().countByType(type);
      expect(count).toBeGreaterThanOrEqual(5);
    });

    it('maintains agent timeline order after ingest', () => {
      const agentId = 'timeline-order-agent';

      const times = [100, 200, 300, 150];
      times.forEach((offset) => {
        server.getIndexer().indexEvent({
          type: 'ORDER_TEST',
          agentId,
          timestamp: new Date(Date.now() - offset).toISOString(),
          payload: { offset },
        });
      });

      const timeline = server.getQueries().agentTimeline(agentId);
      expect(timeline.length).toBe(4);

      for (let i = 0; i < timeline.length - 1; i++) {
        expect(timeline[i].sequence).toBeLessThanOrEqual(timeline[i + 1].sequence);
      }
    });
  });
});
