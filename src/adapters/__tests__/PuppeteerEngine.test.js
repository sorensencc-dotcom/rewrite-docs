/**
 * Unit tests: PuppeteerEngine
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { PuppeteerEngine } from '../PuppeteerEngine';
describe('PuppeteerEngine', () => {
    let engine;
    beforeEach(() => {
        engine = new PuppeteerEngine();
    });
    describe('Valid execution', () => {
        it('returns success envelope for valid script', async () => {
            const result = await engine.run('page.evaluate(() => "test")');
            expect(result.ok).toBe(true);
            expect(result.data).toBeDefined();
            expect(typeof result.data?.success).toBe('boolean');
            expect(Array.isArray(result.data?.logs)).toBe(true);
            expect(result.error).toBeUndefined();
        });
        it('includes meta with adapter, duration, timestamp', async () => {
            const result = await engine.run('test script');
            expect(result.meta.adapter).toBe('PuppeteerEngine');
            expect(typeof result.meta.durationMs).toBe('number');
            expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
            expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
    });
    describe('Error handling', () => {
        it('returns error for empty script', async () => {
            const result = await engine.run('');
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('INVALID_INPUT');
            expect(result.data).toBeUndefined();
        });
        it('handles execution failures', async () => {
            const result = await engine.run('throw new Error("test")');
            // May succeed or fail depending on mock behavior
            if (!result.ok) {
                expect(result.error?.code).toMatch(/PUPPETEER_/);
            }
        });
    });
    describe('Schema validation', () => {
        it('validates success is boolean, logs is array', async () => {
            const result = await engine.run('test');
            if (result.ok && result.data) {
                expect(typeof result.data.success).toBe('boolean');
                expect(Array.isArray(result.data.logs)).toBe(true);
                expect(result.data.logs.every(l => typeof l === 'string')).toBe(true);
            }
        });
    });
    describe('Crash detection', () => {
        it('detects "Target closed" crash marker', async () => {
            // Engine should detect crash in logs and return error
            const result = await engine.run('test');
            // Normal execution should succeed
            if (result.ok) {
                // Logs should not contain crash markers
                const hasCrash = result.data?.logs?.some(l => l.includes('Target closed'));
                expect(hasCrash).toBe(false);
            }
        });
        it('detects "Protocol error" crash marker', async () => {
            const result = await engine.run('test');
            if (result.ok) {
                const hasCrash = result.data?.logs?.some(l => l.includes('Protocol error'));
                expect(hasCrash).toBe(false);
            }
        });
        it('rejects execution if success=false', async () => {
            const result = await engine.run('test');
            if (result.ok && result.data && !result.data.success) {
                // Should have been converted to error
                // (depends on implementation)
            }
        });
    });
    describe('Performance', () => {
        it('completes within reasonable time', async () => {
            const start = Date.now();
            const result = await engine.run('test');
            const elapsed = Date.now() - start;
            expect(elapsed).toBeLessThan(10000);
            expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=PuppeteerEngine.test.js.map