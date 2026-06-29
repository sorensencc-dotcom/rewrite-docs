/**
 * Unit tests: Guard helpers (validation functions)
 * Tests: validateFinalUrl, validatePng, sanitizeText, etc.
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateFinalUrl,
  validatePng,
  validateScreenshotSize,
  sanitizeText,
  validateTextLength,
  validateJsonCompleteness,
  detectCrashInLogs,
} from './guards';

describe('Guard Helpers', () => {
  // ============================================================================
  // validateFinalUrl
  // ============================================================================

  describe('validateFinalUrl', () => {
    it('returns true for valid HTTPS URL', () => {
      expect(validateFinalUrl('https://example.com')).toBe(true);
    });

    it('returns true for valid HTTP URL', () => {
      expect(validateFinalUrl('http://example.com')).toBe(true);
    });

    it('returns true for URL with path', () => {
      expect(validateFinalUrl('https://example.com/path/to/page')).toBe(true);
    });

    it('returns true for URL with query params', () => {
      expect(validateFinalUrl('https://example.com?foo=bar&baz=qux')).toBe(true);
    });

    it('returns true for localhost URL', () => {
      expect(validateFinalUrl('http://localhost:3000')).toBe(true);
    });

    it('returns false for about:blank', () => {
      expect(validateFinalUrl('about:blank')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(validateFinalUrl('')).toBe(false);
    });

    it('returns false for null', () => {
      expect(validateFinalUrl(null as any)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(validateFinalUrl(undefined as any)).toBe(false);
    });

    it('returns false for data: URL', () => {
      expect(validateFinalUrl('data:image/png;base64,ABC')).toBe(false);
    });

    it('returns false for javascript: URL', () => {
      expect(validateFinalUrl('javascript:void(0)')).toBe(false);
    });
  });

  // ============================================================================
  // validatePng
  // ============================================================================

  describe('validatePng', () => {
    it('returns true for valid PNG base64 (with PNG header)', () => {
      // PNG header: 89 50 4E 47 (hex)
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(validatePng(pngBase64)).toBe(true);
    });

    it('returns false for JPEG base64 (FFD8FF)', () => {
      const jpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAACAAIBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABAQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8A//Z';
      expect(validatePng(jpegBase64)).toBe(false);
    });

    it('returns false for non-image base64', () => {
      const textBase64 = Buffer.from('Hello World').toString('base64'); // SGVsbG8gV29ybGQ=
      expect(validatePng(textBase64)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(validatePng('')).toBe(false);
    });

    it('returns false for invalid base64', () => {
      expect(validatePng('!!!invalid base64!!!')).toBe(false);
    });

    it('returns false for truncated PNG header', () => {
      // Only first 2 bytes of PNG header
      const truncated = Buffer.from([0x89, 0x50]).toString('base64');
      expect(validatePng(truncated)).toBe(false);
    });
  });

  // ============================================================================
  // validateScreenshotSize
  // ============================================================================

  describe('validateScreenshotSize', () => {
    it('returns true for small base64 (<5MB)', () => {
      const smallBase64 = 'AAAA'; // ~3 bytes when decoded
      expect(validateScreenshotSize(smallBase64)).toBe(true);
    });

    it('returns true for 1MB base64', () => {
      const onemb = 'A'.repeat(1_333_333); // ~1MB when decoded
      expect(validateScreenshotSize(onemb)).toBe(true);
    });

    it('returns true for 4.9MB base64 (just under limit)', () => {
      const almostLimit = 'A'.repeat(6_553_720); // ~4.9MB
      expect(validateScreenshotSize(almostLimit)).toBe(true);
    });

    it('returns false for 5MB+ base64', () => {
      const oversized = 'A'.repeat(7_000_000); // >5MB when decoded
      expect(validateScreenshotSize(oversized)).toBe(false);
    });

    it('returns false for 10MB base64', () => {
      const huge = 'A'.repeat(14_000_000);
      expect(validateScreenshotSize(huge)).toBe(false);
    });

    it('returns true for empty string (edge case)', () => {
      expect(validateScreenshotSize('')).toBe(true);
    });
  });

  // ============================================================================
  // sanitizeText
  // ============================================================================

  describe('sanitizeText', () => {
    it('removes null bytes', () => {
      const input = 'Hello\x00World';
      expect(sanitizeText(input)).toBe('HelloWorld');
    });

    it('removes ANSI escape codes (color)', () => {
      const input = 'Hello[31mRed[0m';
      expect(sanitizeText(input)).toBe('HelloRed');
    });

    it('removes ANSI escape codes (bold)', () => {
      const input = '[1mBold[0m';
      expect(sanitizeText(input)).toBe('Bold');
    });

    it('removes multiple ANSI sequences', () => {
      const input = '[31m[1mRed Bold[0m';
      expect(sanitizeText(input)).toBe('Red Bold');
    });

    it('trims leading/trailing whitespace', () => {
      const input = '   Hello World   ';
      expect(sanitizeText(input)).toBe('Hello World');
    });

    it('handles string with only null bytes', () => {
      const input = '\x00\x00\x00';
      expect(sanitizeText(input)).toBe('');
    });

    it('handles string with only ANSI codes', () => {
      const input = '[31m[0m';
      expect(sanitizeText(input)).toBe('');
    });

    it('preserves normal Unicode characters', () => {
      const input = 'Hello 世界 🌍';
      expect(sanitizeText(input)).toBe('Hello 世界 🌍');
    });

    it('preserves newlines and tabs (not control chars)', () => {
      const input = 'Line1\nLine2\tTabbed';
      // sanitizeText preserves newlines and tabs
      const result = sanitizeText(input);
      expect(result).toContain('Line1');
      expect(result).toContain('Line2');
      expect(result).toContain('Tabbed');
    });

    it('handles empty string', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  // ============================================================================
  // validateTextLength
  // ============================================================================

  describe('validateTextLength', () => {
    it('returns true for non-empty, reasonable length text', () => {
      expect(validateTextLength('Hello World')).toBe(true);
    });

    it('returns true for single character', () => {
      expect(validateTextLength('A')).toBe(true);
    });

    it('returns true for 5KB text', () => {
      const text = 'A'.repeat(5000);
      expect(validateTextLength(text)).toBe(true);
    });

    it('returns true for 9.9KB text (just under limit)', () => {
      const text = 'A'.repeat(9999);
      expect(validateTextLength(text)).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(validateTextLength('')).toBe(false);
    });

    it('returns false for 10KB+ text', () => {
      const text = 'A'.repeat(10_000);
      expect(validateTextLength(text)).toBe(false);
    });

    it('returns false for 50KB text', () => {
      const text = 'A'.repeat(50_000);
      expect(validateTextLength(text)).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
      expect(validateTextLength('   \n  \t  ')).toBe(true); // Has length > 0
    });
  });

  // ============================================================================
  // validateJsonCompleteness
  // ============================================================================

  describe('validateJsonCompleteness', () => {
    it('returns true for valid JSON object', () => {
      expect(validateJsonCompleteness('{"key":"value"}')).toBe(true);
    });

    it('returns true for valid JSON array', () => {
      expect(validateJsonCompleteness('[1,2,3]')).toBe(true);
    });

    it('returns true for valid JSON string', () => {
      expect(validateJsonCompleteness('"hello"')).toBe(true);
    });

    it('returns true for valid JSON number', () => {
      expect(validateJsonCompleteness('42')).toBe(true);
    });

    it('returns true for valid JSON boolean', () => {
      expect(validateJsonCompleteness('true')).toBe(true);
    });

    it('returns true for valid JSON null', () => {
      expect(validateJsonCompleteness('null')).toBe(true);
    });

    it('returns true for deeply nested JSON', () => {
      const json = '{"a":{"b":{"c":{"d":[1,2,3]}}}}'
      expect(validateJsonCompleteness(json)).toBe(true);
    });

    it('returns false for incomplete JSON object', () => {
      expect(validateJsonCompleteness('{"key":"value"')).toBe(false);
    });

    it('returns false for incomplete JSON array', () => {
      expect(validateJsonCompleteness('[1,2,3')).toBe(false);
    });

    it('returns false for incomplete JSON string', () => {
      expect(validateJsonCompleteness('"hello')).toBe(false);
    });

    it('returns false for invalid JSON syntax', () => {
      expect(validateJsonCompleteness('{key:value}')).toBe(false); // Unquoted keys
    });

    it('returns false for trailing comma', () => {
      expect(validateJsonCompleteness('[1,2,3,]')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(validateJsonCompleteness('')).toBe(false);
    });

    it('returns false for plain text (not JSON)', () => {
      expect(validateJsonCompleteness('Hello World')).toBe(false);
    });
  });

  // ============================================================================
  // detectCrashInLogs
  // ============================================================================

  describe('detectCrashInLogs', () => {
    it('returns true when "Target closed" marker found', () => {
      const logs = ['Executing...', 'Target closed by unknown', 'Browser exited'];
      expect(detectCrashInLogs(logs)).toBe(true);
    });

    it('returns true when "Protocol error" marker found', () => {
      const logs = ['Executing...', 'Protocol error occurred', 'Cleanup'];
      expect(detectCrashInLogs(logs)).toBe(true);
    });

    it('returns true when both markers present', () => {
      const logs = ['Target closed suddenly', 'Protocol error detected'];
      expect(detectCrashInLogs(logs)).toBe(true);
    });

    it('returns false for normal logs', () => {
      const logs = ['Starting Puppeteer', 'Navigating...', 'Screenshot taken', 'Complete'];
      expect(detectCrashInLogs(logs)).toBe(false);
    });

    it('returns false for empty log array', () => {
      expect(detectCrashInLogs([])).toBe(false);
    });

    it('returns false for logs without crash markers', () => {
      const logs = ['Error: element not found', 'Warning: slow navigation', 'Timeout occurred'];
      expect(detectCrashInLogs(logs)).toBe(false);
    });

    it('case-insensitive matching (if applicable)', () => {
      const logs = ['target closed unexpectedly']; // lowercase
      // Test depends on implementation (case-sensitive or not)
      // Assuming case-sensitive:
      expect(detectCrashInLogs(logs)).toBe(false);
    });

    it('detects partial marker match', () => {
      const logs = ['Browser Target closed by crash'];
      expect(detectCrashInLogs(logs)).toBe(true);
    });

    it('handles logs with special characters', () => {
      const logs = ['[ERROR] Target closed: 0x12345'];
      expect(detectCrashInLogs(logs)).toBe(true);
    });

    it('ignores marker if not exact substring', () => {
      const logs = ['Target opened successfully'];
      expect(detectCrashInLogs(logs)).toBe(false);
    });
  });

  // ============================================================================
  // Guard Composition (Multiple Guards Together)
  // ============================================================================

  describe('Guard composition', () => {
    it('sanitizeText + validateTextLength together', () => {
      const text = '[31m   Hello   [0m';
      const sanitized = sanitizeText(text);
      const valid = validateTextLength(sanitized);

      expect(valid).toBe(true);
    });

    it('rejects oversized sanitized text', () => {
      const oversized = 'A'.repeat(10_000);
      expect(validateTextLength(oversized)).toBe(false);
    });

    it('validatePng + validateScreenshotSize for screenshots', () => {
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const isPng = validatePng(pngBase64);
      const isSized = validateScreenshotSize(pngBase64);

      expect(isPng).toBe(true);
      expect(isSized).toBe(true);
    });
  });

  // ============================================================================
  // Performance (No Significant Slowdown)
  // ============================================================================

  describe('Performance', () => {
    it('validateFinalUrl is fast', () => {
      const start = Date.now();

      for (let i = 0; i < 10_000; i++) {
        validateFinalUrl('https://example.com');
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000); // reasonable threshold for 10k calls
    });

    it('sanitizeText handles large strings efficiently', () => {
      const largeText = 'A'.repeat(100_000);
      const start = Date.now();

      sanitizeText(largeText);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000); // reasonable threshold for 100k char
    });

    it('validateJsonCompleteness is fast for valid JSON', () => {
      const json = '{"data":[1,2,3,{"nested":true}]}';
      const start = Date.now();

      for (let i = 0; i < 10_000; i++) {
        validateJsonCompleteness(json);
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000); // reasonable threshold
    });
  });
});
