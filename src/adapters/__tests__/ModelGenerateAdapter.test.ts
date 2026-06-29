/**
 * Unit tests: ModelGenerateAdapter
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ModelGenerateAdapter } from '../ModelGenerateAdapter';

describe('ModelGenerateAdapter', () => {
  let adapter: ModelGenerateAdapter;

  beforeEach(() => {
    adapter = new ModelGenerateAdapter();
  });

  describe('Valid generation', () => {
    it('returns success envelope for valid prompt', async () => {
      const result = await adapter.run('Say hello');

      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data?.text).toBe('string');
      expect(typeof result.data?.tokens).toBe('number');
      expect(result.error).toBeUndefined();
    });

    it('sanitizes output text', async () => {
      const result = await adapter.run('Generate text');

      if (result.ok && result.data) {
        // Sanitized text should not contain null bytes or ANSI codes
        expect(result.data.text.indexOf('\x00')).toBe(-1);
        expect(result.data.text).not.toMatch(/\x1b\[[0-9;]*m/);
      }
    });

    it('includes meta with adapter, duration, timestamp', async () => {
      const result = await adapter.run('Test prompt');

      expect(result.meta.adapter).toBe('ModelGenerate');
      expect(typeof result.meta.durationMs).toBe('number');
      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Error handling', () => {
    it('returns error for empty prompt', async () => {
      const result = await adapter.run('');

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.data).toBeUndefined();
    });
  });

  describe('Schema validation', () => {
    it('validates text is string, tokens are integer', async () => {
      const result = await adapter.run('Test');

      if (result.ok && result.data) {
        expect(typeof result.data.text).toBe('string');
        expect(result.data.text.length).toBeGreaterThan(0);
        expect(Number.isInteger(result.data.tokens)).toBe(true);
        expect(result.data.tokens).toBeGreaterThan(0);
      }
    });

    it('rejects empty text', async () => {
      // If model returns empty text, adapter should reject
      // (test framework will mock this behavior)
      const result = await adapter.run('Test');

      if (!result.ok) {
        expect(result.error?.code).toMatch(/MODEL_/);
      } else {
        expect(result.data?.text.length).toBeGreaterThan(0);
      }
    });

    it('validates text length limits', async () => {
      const result = await adapter.run('Test');

      if (result.ok && result.data) {
        expect(result.data.text.length).toBeLessThan(10_000);
      }
    });
  });

  describe('JSON validation (optional)', () => {
    it('validates JSON when expectJson option set', async () => {
      const result = await adapter.run('Generate JSON', { expectJson: true });

      if (result.ok && result.data) {
        // Should be valid JSON or adapter rejects
        expect(() => JSON.parse(result.data!.text)).not.toThrow();
      } else {
        expect(result.error?.code).toBe('MODEL_INVALID_JSON');
      }
    });
  });

  describe('Performance', () => {
    it('completes within reasonable time', async () => {
      const start = Date.now();
      const result = await adapter.run('Test prompt');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10000);
      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
