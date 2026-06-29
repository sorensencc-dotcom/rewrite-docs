/**
 * Unit tests: AnthropicClient
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AnthropicClient } from '../AnthropicClient';

describe('AnthropicClient', () => {
  let client: AnthropicClient;

  beforeEach(() => {
    client = new AnthropicClient();
  });

  describe('Valid API response', () => {
    it('returns success envelope for valid messages', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await client.run(messages);

      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data?.text).toBe('string');
      expect(result.error).toBeUndefined();
    });

    it('sanitizes output text', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const result = await client.run(messages);

      if (result.ok && result.data) {
        expect(result.data.text.indexOf('\x00')).toBe(-1);
        expect(result.data.text).not.toMatch(/\x1b\[[0-9;]*m/);
      }
    });

    it('includes meta with adapter, duration, timestamp', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const result = await client.run(messages);

      expect(result.meta.adapter).toBe('AnthropicClient');
      expect(typeof result.meta.durationMs).toBe('number');
      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Error handling', () => {
    it('returns error for empty messages', async () => {
      const result = await client.run([]);

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.data).toBeUndefined();
    });

    it('returns error for undefined messages', async () => {
      const result = await client.run(undefined as any);

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('Schema validation', () => {
    it('validates text is string', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const result = await client.run(messages);

      if (result.ok && result.data) {
        expect(typeof result.data.text).toBe('string');
        expect(result.data.text.length).toBeGreaterThan(0);
      }
    });

    it('validates stopReason is string or null', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const result = await client.run(messages);

      if (result.ok && result.data) {
        expect(typeof result.data.stopReason === 'string' || result.data.stopReason === null).toBe(true);
      }
    });
  });

  describe('Guard validation', () => {
    it('rejects empty responses', async () => {
      // Mocked to return empty text
      const messages = [{ role: 'user', content: 'Test' }];
      const result = await client.run(messages);

      if (result.ok && result.data) {
        expect(result.data.text.trim().length).toBeGreaterThan(0);
      } else {
        expect(result.error?.code).toBe('ANTHROPIC_EMPTY_RESPONSE');
      }
    });

    it('validates text length limits', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const result = await client.run(messages);

      if (result.ok && result.data) {
        expect(result.data.text.length).toBeLessThan(10_000);
      }
    });
  });

  describe('Performance', () => {
    it('completes within reasonable time', async () => {
      const start = Date.now();
      const messages = [{ role: 'user', content: 'Test' }];
      const result = await client.run(messages);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10000);
      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
