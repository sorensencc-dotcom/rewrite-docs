/**
 * BrowserScreenshotAdapter: Wraps browser.screenshot() output
 * Validates: PNG format, image dimensions, file size
 */

import { makeSuccess, makeError, AdapterResponse } from '../validation/envelope';
import { validatePng, validateScreenshotSize } from '../validation/guards';
import { ScreenshotResultSchema, ScreenshotResult } from '../validation/schemas';
import { metricsExporter } from '../metrics/MetricsExporter';

export class BrowserScreenshotAdapter {
  async run(options?: { width?: number; height?: number }): Promise<AdapterResponse<ScreenshotResult>> {
    const startTime = Date.now();
    const adapter = 'BrowserScreenshot';

    try {
      // TODO: Call actual browser.screenshot(options)
      // For now, simulate a valid PNG response
      const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const mockResult = {
        base64: mockBase64,
        width: options?.width || 1920,
        height: options?.height || 1080,
      };

      // Validate against schema
      const parsed = ScreenshotResultSchema.safeParse(mockResult);
      if (!parsed.success) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'INVALID_SCREENSHOT_RESULT');
        metricsExporter.recordSchemaViolation(adapter, 'result');
        return makeError(
          'INVALID_SCREENSHOT_RESULT',
          { reason: 'schema validation failed', errors: parsed.error },
          adapter,
          startTime
        );
      }

      // Guard: validate PNG header
      if (!validatePng(parsed.data.base64)) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'INVALID_IMAGE_FORMAT');
        return makeError(
          'INVALID_IMAGE_FORMAT',
          { reason: 'PNG header validation failed' },
          adapter,
          startTime
        );
      }

      // Guard: validate size
      if (!validateScreenshotSize(parsed.data.base64)) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'SCREENSHOT_TOO_LARGE');
        return makeError(
          'SCREENSHOT_TOO_LARGE',
          { reason: 'screenshot exceeds 5MB limit', size: parsed.data.base64.length },
          adapter,
          startTime
        );
      }

      const durationMs = Date.now() - startTime;
      metricsExporter.recordAdapterCall(adapter, durationMs, 'success');
      return makeSuccess(parsed.data, adapter, startTime);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
      metricsExporter.recordAdapterError(adapter, 'SCREENSHOT_FAILED');
      return makeError(
        'SCREENSHOT_FAILED',
        { reason: err instanceof Error ? err.message : 'unknown error' },
        adapter,
        startTime
      );
    }
  }
}
