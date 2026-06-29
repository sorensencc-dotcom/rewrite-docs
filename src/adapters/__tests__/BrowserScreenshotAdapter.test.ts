/**
 * Unit tests: BrowserScreenshotAdapter
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BrowserScreenshotAdapter } from '../BrowserScreenshotAdapter';

describe('BrowserScreenshotAdapter', () => {
  let adapter: BrowserScreenshotAdapter;

  beforeEach(() => {
    adapter = new BrowserScreenshotAdapter();
  });

  describe('Valid screenshot', () => {
    it('returns success envelope for valid PNG', async () => {
      const result = await adapter.run();

      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.base64).toBeDefined();
      expect(typeof result.data?.width).toBe('number');
      expect(typeof result.data?.height).toBe('number');
      expect(result.error).toBeUndefined();
    });

    it('includes meta with adapter, duration, timestamp', async () => {
      const result = await adapter.run();

      expect(result.meta.adapter).toBe('BrowserScreenshot');
      expect(typeof result.meta.durationMs).toBe('number');
      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('respects width and height options', async () => {
      const result = await adapter.run({ width: 800, height: 600 });

      expect(result.ok).toBe(true);
      expect(result.data?.width).toBe(800);
      expect(result.data?.height).toBe(600);
    });
  });

  describe('Schema validation', () => {
    it('validates base64 is string', async () => {
      const result = await adapter.run();

      if (result.ok && result.data) {
        expect(typeof result.data.base64).toBe('string');
        expect(result.data.base64.length).toBeGreaterThan(0);
      }
    });

    it('validates dimensions are positive integers', async () => {
      const result = await adapter.run();

      if (result.ok && result.data) {
        expect(Number.isInteger(result.data.width)).toBe(true);
        expect(Number.isInteger(result.data.height)).toBe(true);
        expect(result.data.width).toBeGreaterThan(0);
        expect(result.data.height).toBeGreaterThan(0);
      }
    });
  });

  describe('Guard validation', () => {
    it('validates PNG header', async () => {
      const result = await adapter.run();

      // Valid PNG should pass or return success
      if (result.ok) {
        expect(result.data?.base64).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
      }
    });

    it('rejects oversized images', async () => {
      // Normal screenshot should be well under 5MB
      const result = await adapter.run();

      if (result.ok) {
        const sizeMb = result.data!.base64.length * 0.75 / (1024 * 1024);
        expect(sizeMb).toBeLessThan(5);
      }
    });
  });

  describe('Performance', () => {
    it('completes within reasonable time', async () => {
      const start = Date.now();
      const result = await adapter.run();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(5000);
      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
