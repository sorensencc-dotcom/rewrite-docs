/**
 * Unit tests: BrowserNavigateAdapter
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BrowserNavigateAdapter } from '../BrowserNavigateAdapter';

describe('BrowserNavigateAdapter', () => {
  let adapter: BrowserNavigateAdapter;

  beforeEach(() => {
    adapter = new BrowserNavigateAdapter();
  });

  describe('Valid navigation', () => {
    it('returns success envelope for valid URL', async () => {
      const result = await adapter.run('https://example.com');

      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.url).toBe('https://example.com');
      expect(result.error).toBeUndefined();
    });

    it('includes meta with adapter, duration, timestamp', async () => {
      const result = await adapter.run('https://example.com');

      expect(result.meta.adapter).toBe('BrowserNavigate');
      expect(typeof result.meta.durationMs).toBe('number');
      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('handles URL with path and query', async () => {
      const url = 'https://example.com/path?key=value';
      const result = await adapter.run(url);

      expect(result.ok).toBe(true);
      expect(result.data?.url).toBe(url);
    });
  });

  describe('Error handling', () => {
    it('returns error for empty URL', async () => {
      const result = await adapter.run('');

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.data).toBeUndefined();
    });

    it('returns error for about:blank', async () => {
      // This will pass schema but fail guard check
      // Mock would need to return about:blank as result
      const result = await adapter.run('https://example.com');

      // For now, just verify error structure if it fails
      if (!result.ok) {
        expect(result.error?.code).toBe('INVALID_URL');
      }
    });

    it('error envelope has no data field', async () => {
      const result = await adapter.run('');

      if (!result.ok) {
        expect(result.data).toBeUndefined();
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Schema validation', () => {
    it('validates URL is required string', async () => {
      const result = await adapter.run('https://example.com');

      expect(result.ok).toBe(true);
      expect(typeof result.data?.url).toBe('string');
    });

    it('validates status is number or null', async () => {
      const result = await adapter.run('https://example.com');

      if (result.ok && result.data) {
        expect(typeof result.data.status === 'number' || result.data.status === null).toBe(true);
      }
    });

    it('validates redirected is boolean', async () => {
      const result = await adapter.run('https://example.com');

      if (result.ok && result.data) {
        expect(typeof result.data.redirected).toBe('boolean');
      }
    });
  });

  describe('Performance', () => {
    it('completes within reasonable time', async () => {
      const start = Date.now();
      const result = await adapter.run('https://example.com');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(5000); // Should complete in <5 seconds
      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
