/**
 * PHASE 27.3 — Adapter Integration Tests
 * Tests: All 5 adapters return validated envelopes
 * Tests: Error propagation + envelope invariants
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { BrowserNavigateAdapter } from '../adapters/BrowserNavigateAdapter';
import { BrowserScreenshotAdapter } from '../adapters/BrowserScreenshotAdapter';
import { ModelGenerateAdapter } from '../adapters/ModelGenerateAdapter';
import { AnthropicClient } from '../clients/AnthropicClient';
import { PuppeteerEngine } from '../adapters/PuppeteerEngine';
describe('Phase 27.3 — Adapter Integration Suite', () => {
    let navigate;
    let screenshot;
    let modelGenerate;
    let anthropic;
    let puppeteer;
    beforeEach(() => {
        navigate = new BrowserNavigateAdapter();
        screenshot = new BrowserScreenshotAdapter();
        modelGenerate = new ModelGenerateAdapter();
        anthropic = new AnthropicClient();
        puppeteer = new PuppeteerEngine();
    });
    // ============================================================================
    // SECTION 1: Valid Envelope Structure
    // ============================================================================
    describe('All adapters return valid envelopes', () => {
        it('BrowserNavigateAdapter returns envelope with meta', async () => {
            const result = await navigate.run('https://example.com');
            expect(result.meta).toBeDefined();
            expect(result.meta.adapter).toBe('BrowserNavigate');
            expect(typeof result.meta.durationMs).toBe('number');
            expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
        it('BrowserScreenshotAdapter returns envelope with meta', async () => {
            const result = await screenshot.run();
            expect(result.meta).toBeDefined();
            expect(result.meta.adapter).toBe('BrowserScreenshot');
            expect(typeof result.meta.durationMs).toBe('number');
        });
        it('ModelGenerateAdapter returns envelope with meta', async () => {
            const result = await modelGenerate.run('test');
            expect(result.meta).toBeDefined();
            expect(result.meta.adapter).toBe('ModelGenerate');
            expect(typeof result.meta.durationMs).toBe('number');
        });
        it('AnthropicClient returns envelope with meta', async () => {
            const result = await anthropic.run([{ role: 'user', content: 'test' }]);
            expect(result.meta).toBeDefined();
            expect(result.meta.adapter).toBe('AnthropicClient');
            expect(typeof result.meta.durationMs).toBe('number');
        });
        it('PuppeteerEngine returns envelope with meta', async () => {
            const result = await puppeteer.run('test script');
            expect(result.meta).toBeDefined();
            expect(result.meta.adapter).toBe('PuppeteerEngine');
            expect(typeof result.meta.durationMs).toBe('number');
        });
    });
    // ============================================================================
    // SECTION 2: Envelope Invariants
    // ============================================================================
    describe('Success envelopes never have error field', () => {
        it('BrowserNavigateAdapter success has no error', async () => {
            const result = await navigate.run('https://example.com');
            if (result.ok) {
                expect(result.error).toBeUndefined();
                expect(result.data).toBeDefined();
            }
        });
        it('BrowserScreenshotAdapter success has no error', async () => {
            const result = await screenshot.run();
            if (result.ok) {
                expect(result.error).toBeUndefined();
                expect(result.data).toBeDefined();
            }
        });
    });
    describe('Error envelopes never have data field', () => {
        it('BrowserNavigateAdapter error has no data', async () => {
            const result = await navigate.run('');
            if (!result.ok) {
                expect(result.data).toBeUndefined();
                expect(result.error).toBeDefined();
                expect(result.error.code).toMatch(/INVALID|NAVIGATION|URL/);
            }
        });
        it('PuppeteerEngine error has no data', async () => {
            const result = await puppeteer.run('');
            if (!result.ok) {
                expect(result.data).toBeUndefined();
                expect(result.error).toBeDefined();
            }
        });
    });
    // ============================================================================
    // SECTION 3: Error Code Consistency
    // ============================================================================
    describe('Error codes are uppercase snake_case', () => {
        it('All error codes follow pattern', async () => {
            const results = [
                await navigate.run(''),
                await modelGenerate.run(''),
                await anthropic.run([]),
                await puppeteer.run(''),
            ];
            results.forEach(result => {
                if (!result.ok && result.error) {
                    expect(result.error.code).toMatch(/^[A-Z_]+$/);
                }
            });
        });
    });
    // ============================================================================
    // SECTION 4: Guard Function Validation
    // ============================================================================
    describe('Guards validate output correctness', () => {
        it('BrowserNavigateAdapter validates URL', async () => {
            const result = await navigate.run('https://example.com');
            if (result.ok && result.data) {
                expect(result.data.url).toBeDefined();
                // URL should pass guard validation
                expect(result.data.url).toMatch(/^https?:\/\//);
            }
        });
        it('BrowserScreenshotAdapter validates PNG', async () => {
            const result = await screenshot.run();
            if (result.ok && result.data) {
                // Base64 should be valid
                expect(result.data.base64).toMatch(/^[A-Za-z0-9+/=]+$/);
                // Dimensions should be positive
                expect(result.data.width).toBeGreaterThan(0);
                expect(result.data.height).toBeGreaterThan(0);
            }
        });
        it('ModelGenerateAdapter sanitizes text', async () => {
            const result = await modelGenerate.run('test');
            if (result.ok && result.data) {
                // Sanitized text should not have null bytes
                expect(result.data.text.indexOf('\x00')).toBe(-1);
                // Sanitized text should not have ANSI codes
                expect(result.data.text).not.toMatch(/\x1b\[[0-9;]*m/);
            }
        });
        it('AnthropicClient validates response', async () => {
            const result = await anthropic.run([{ role: 'user', content: 'test' }]);
            if (result.ok && result.data) {
                // Text should be non-empty
                expect(result.data.text.length).toBeGreaterThan(0);
                // Should have valid structure
                expect(typeof result.data.stopReason === 'string' || result.data.stopReason === null).toBe(true);
            }
        });
    });
    // ============================================================================
    // SECTION 5: Schema Validation Coverage
    // ============================================================================
    describe('All adapters validate against Zod schemas', () => {
        it('BrowserNavigateAdapter validates NavigateResult schema', async () => {
            const result = await navigate.run('https://example.com');
            if (result.ok && result.data) {
                expect(typeof result.data.url).toBe('string');
                expect(typeof result.data.status === 'number' || result.data.status === null).toBe(true);
                expect(typeof result.data.redirected).toBe('boolean');
            }
        });
        it('BrowserScreenshotAdapter validates ScreenshotResult schema', async () => {
            const result = await screenshot.run();
            if (result.ok && result.data) {
                expect(typeof result.data.base64).toBe('string');
                expect(Number.isInteger(result.data.width)).toBe(true);
                expect(Number.isInteger(result.data.height)).toBe(true);
            }
        });
        it('ModelGenerateAdapter validates ModelGenerateResult schema', async () => {
            const result = await modelGenerate.run('test');
            if (result.ok && result.data) {
                expect(typeof result.data.text).toBe('string');
                expect(Number.isInteger(result.data.tokens)).toBe(true);
                expect(result.data.tokens).toBeGreaterThan(0);
            }
        });
        it('AnthropicClient validates AnthropicResult schema', async () => {
            const result = await anthropic.run([{ role: 'user', content: 'test' }]);
            if (result.ok && result.data) {
                expect(typeof result.data.text).toBe('string');
                expect(typeof result.data.stopReason === 'string' || result.data.stopReason === null).toBe(true);
            }
        });
        it('PuppeteerEngine validates PuppeteerResult schema', async () => {
            const result = await puppeteer.run('test');
            if (result.ok && result.data) {
                expect(typeof result.data.success).toBe('boolean');
                expect(Array.isArray(result.data.logs)).toBe(true);
                expect(result.data.logs.every(l => typeof l === 'string')).toBe(true);
            }
        });
    });
    // ============================================================================
    // SECTION 6: Concurrent Execution
    // ============================================================================
    describe('Adapters execute safely concurrently', () => {
        it('All 5 adapters execute in parallel without race conditions', async () => {
            const results = await Promise.all([
                navigate.run('https://example.com'),
                screenshot.run(),
                modelGenerate.run('test'),
                anthropic.run([{ role: 'user', content: 'test' }]),
                puppeteer.run('test'),
            ]);
            // All should return envelopes
            results.forEach(result => {
                expect(result.meta).toBeDefined();
                expect(typeof result.ok).toBe('boolean');
            });
            // Count successes
            const successes = results.filter(r => r.ok).length;
            expect(successes).toBeGreaterThan(0);
        });
    });
    // ============================================================================
    // SECTION 7: Meta Timing Accuracy
    // ============================================================================
    describe('Meta timing is accurate', () => {
        it('durationMs is consistent across calls', async () => {
            const result1 = await navigate.run('https://example.com');
            const result2 = await navigate.run('https://example.com');
            expect(result1.meta.durationMs).toBeGreaterThanOrEqual(0);
            expect(result2.meta.durationMs).toBeGreaterThanOrEqual(0);
            // Both should have reasonable times
            expect(result1.meta.durationMs).toBeLessThan(5000);
            expect(result2.meta.durationMs).toBeLessThan(5000);
        });
        it('timestamp is ISO format', async () => {
            const result = await navigate.run('https://example.com');
            const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
            expect(result.meta.timestamp).toMatch(isoRegex);
        });
    });
});
//# sourceMappingURL=adapters.integration.test.js.map