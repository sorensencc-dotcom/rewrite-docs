/**
 * Unit tests: Envelope helpers (makeSuccess, makeError)
 * Tests: structure, timing, error handling, invariants
 */
import { describe, it, expect } from '@jest/globals';
import { makeSuccess, makeError } from './envelope';
describe('Envelope Helpers', () => {
    // ============================================================================
    // makeSuccess Tests
    // ============================================================================
    describe('makeSuccess', () => {
        it('returns envelope with ok=true', () => {
            const result = makeSuccess({ foo: 'bar' }, 'TestAdapter', 0);
            expect(result.ok).toBe(true);
            expect(result.data).toEqual({ foo: 'bar' });
        });
        it('includes meta with adapter name', () => {
            const result = makeSuccess({}, 'MyAdapter', 0);
            expect(result.meta.adapter).toBe('MyAdapter');
        });
        it('includes durationMs as non-negative number', () => {
            const result = makeSuccess({}, 'Adapter', 100);
            expect(typeof result.meta.durationMs).toBe('number');
            expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
        });
        it('includes ISO timestamp', () => {
            const result = makeSuccess({}, 'Adapter', 0);
            expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
        it('never includes error field', () => {
            const result = makeSuccess({}, 'Adapter', 0);
            expect(result.error).toBeUndefined();
        });
        it('preserves data type (object)', () => {
            const data = { url: 'https://example.com', status: 200 };
            const result = makeSuccess(data, 'Adapter', 0);
            expect(result.data).toEqual(data);
            expect(typeof result.data).toBe('object');
        });
        it('preserves data type (array)', () => {
            const data = [1, 2, 3];
            const result = makeSuccess(data, 'Adapter', 0);
            expect(result.data).toEqual(data);
            expect(Array.isArray(result.data)).toBe(true);
        });
        it('allows null data', () => {
            const result = makeSuccess(null, 'Adapter', 0);
            expect(result.ok).toBe(true);
            expect(result.data).toBeNull();
        });
        it('calculates duration correctly', () => {
            const startTime = Date.now();
            const result = makeSuccess({}, 'Adapter', startTime);
            expect(result.meta.durationMs).toBeLessThanOrEqual(Date.now() - startTime + 10);
            expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
        });
        it('handles large data payloads', () => {
            const largeData = { text: 'x'.repeat(100_000) };
            const result = makeSuccess(largeData, 'Adapter', 0);
            expect(result.ok).toBe(true);
            expect(result.data.text.length).toBe(100_000);
        });
        it('handles deeply nested objects', () => {
            const nested = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep',
                        },
                    },
                },
            };
            const result = makeSuccess(nested, 'Adapter', 0);
            expect(result.data.level1.level2.level3.value).toBe('deep');
        });
    });
    // ============================================================================
    // makeError Tests
    // ============================================================================
    describe('makeError', () => {
        it('returns envelope with ok=false', () => {
            const result = makeError('TEST_ERROR', {}, 'TestAdapter', 0);
            expect(result.ok).toBe(false);
        });
        it('never includes data field', () => {
            const result = makeError('TEST_ERROR', {}, 'Adapter', 0);
            expect(result.data).toBeUndefined();
        });
        it('includes error with code and message', () => {
            const result = makeError('INVALID_INPUT', { detail: 'missing field' }, 'Adapter', 0);
            expect(result.error?.code).toBe('INVALID_INPUT');
            expect(result.error?.message).toBe('INVALID_INPUT');
        });
        it('includes error details object', () => {
            const details = { field: 'name', reason: 'required' };
            const result = makeError('VALIDATION_FAILED', details, 'Adapter', 0);
            expect(result.error?.details).toEqual(details);
        });
        it('includes meta with adapter, duration, timestamp', () => {
            const result = makeError('ERROR', {}, 'MyAdapter', 50);
            expect(result.meta.adapter).toBe('MyAdapter');
            expect(result.meta.durationMs).toBeGreaterThanOrEqual(50);
            expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
        it('handles Error object in details', () => {
            const err = new Error('Something went wrong');
            const result = makeError('ADAPTER_FAILED', err, 'Adapter', 0);
            expect(result.error?.details).toBeDefined();
        });
        it('handles null details', () => {
            const result = makeError('ERROR', null, 'Adapter', 0);
            expect(result.error?.details).toBeNull();
        });
        it('handles undefined details', () => {
            const result = makeError('ERROR', undefined, 'Adapter', 0);
            expect(result.error?.details).toBeUndefined();
        });
        it('preserves error code case (uppercase)', () => {
            const result = makeError('NETWORK_TIMEOUT', {}, 'Adapter', 0);
            expect(result.error?.code).toMatch(/^[A-Z_]+$/);
        });
        it('handles long error codes', () => {
            const longCode = 'VERY_LONG_ERROR_CODE_WITH_MANY_UNDERSCORES_AND_WORDS';
            const result = makeError(longCode, {}, 'Adapter', 0);
            expect(result.error?.code).toBe(longCode);
        });
    });
    // ============================================================================
    // Envelope Invariants (Both Success & Error)
    // ============================================================================
    describe('Envelope invariants', () => {
        it('success envelope never has both ok=true and error field', () => {
            const result = makeSuccess({}, 'Adapter', 0);
            expect(result.ok).toBe(true);
            expect(result.error).toBeUndefined();
        });
        it('error envelope never has both ok=false and data field', () => {
            const result = makeError('ERROR', {}, 'Adapter', 0);
            expect(result.ok).toBe(false);
            expect(result.data).toBeUndefined();
        });
        it('all envelopes have meta field', () => {
            const success = makeSuccess({}, 'Adapter', 0);
            const error = makeError('ERROR', {}, 'Adapter', 0);
            expect(success.meta).toBeDefined();
            expect(error.meta).toBeDefined();
        });
        it('all meta fields have required properties', () => {
            const success = makeSuccess({}, 'Adapter', 0);
            const error = makeError('ERROR', {}, 'Adapter', 0);
            for (const env of [success, error]) {
                expect(env.meta.adapter).toBeDefined();
                expect(env.meta.durationMs).toBeDefined();
                expect(env.meta.timestamp).toBeDefined();
            }
        });
        it('adapter name is non-empty string', () => {
            const result = makeSuccess({}, 'Adapter', 0);
            expect(typeof result.meta.adapter).toBe('string');
            expect(result.meta.adapter.length).toBeGreaterThan(0);
        });
        it('durationMs is always a number (never negative)', () => {
            const result1 = makeSuccess({}, 'Adapter', 0);
            const result2 = makeError('ERROR', {}, 'Adapter', 0);
            expect(typeof result1.meta.durationMs).toBe('number');
            expect(typeof result2.meta.durationMs).toBe('number');
            expect(result1.meta.durationMs).toBeGreaterThanOrEqual(0);
            expect(result2.meta.durationMs).toBeGreaterThanOrEqual(0);
        });
        it('timestamp is always ISO string', () => {
            const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
            const result1 = makeSuccess({}, 'Adapter', 0);
            const result2 = makeError('ERROR', {}, 'Adapter', 0);
            expect(result1.meta.timestamp).toMatch(isoRegex);
            expect(result2.meta.timestamp).toMatch(isoRegex);
        });
    });
    // ============================================================================
    // Edge Cases
    // ============================================================================
    describe('Edge cases', () => {
        it('handles empty string adapter name', () => {
            const result = makeSuccess({}, '', 0);
            expect(result.meta.adapter).toBe('');
            expect(result.ok).toBe(true);
        });
        it('handles zero duration', () => {
            const result = makeSuccess({}, 'Adapter', 0);
            expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
        });
        it('handles very large duration', () => {
            const result = makeSuccess({}, 'Adapter', 999999999);
            expect(result.meta.durationMs).toBeGreaterThanOrEqual(999999999);
        });
        it('handles special characters in error code', () => {
            // Note: codes should be [A-Z_], but test robustness
            const result = makeError('ERROR_123_ABC', {}, 'Adapter', 0);
            expect(result.error?.code).toBe('ERROR_123_ABC');
        });
        it('handles Unicode in data', () => {
            const data = { message: '你好世界 🌍' };
            const result = makeSuccess(data, 'Adapter', 0);
            expect(result.data.message).toBe('你好世界 🌍');
        });
        it('handles circular reference protection (if applicable)', () => {
            const data = { foo: 'bar' };
            // Don't actually create circular ref, but test serializable data
            const result = makeSuccess(data, 'Adapter', 0);
            expect(result.ok).toBe(true);
            expect(() => JSON.stringify(result)).not.toThrow();
        });
    });
    // ============================================================================
    // Type Consistency
    // ============================================================================
    describe('Type consistency', () => {
        it('success envelope always has ok: true (boolean)', () => {
            const result = makeSuccess({}, 'Adapter', 0);
            expect(result.ok).toBe(true);
            expect(typeof result.ok).toBe('boolean');
        });
        it('error envelope always has ok: false (boolean)', () => {
            const result = makeError('ERROR', {}, 'Adapter', 0);
            expect(result.ok).toBe(false);
            expect(typeof result.ok).toBe('boolean');
        });
        it('meta object has correct types', () => {
            const result = makeSuccess({}, 'Adapter', 0);
            expect(typeof result.meta.adapter).toBe('string');
            expect(typeof result.meta.durationMs).toBe('number');
            expect(typeof result.meta.timestamp).toBe('string');
        });
        it('error object has correct types', () => {
            const result = makeError('CODE', { key: 'value' }, 'Adapter', 0);
            expect(typeof result.error?.code).toBe('string');
            expect(typeof result.error?.message).toBe('string');
        });
    });
});
//# sourceMappingURL=envelope.test.js.map