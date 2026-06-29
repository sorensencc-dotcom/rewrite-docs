/**
 * PuppeteerEngine: Wraps Puppeteer execution result
 * Validates: success flag, log output, crash detection
 */

import { makeSuccess, makeError, AdapterResponse } from '../validation/envelope';
import { detectCrashInLogs } from '../validation/guards';
import { PuppeteerResultSchema, PuppeteerResult } from '../validation/schemas';
import { metricsExporter } from '../metrics/MetricsExporter';

export class PuppeteerEngine {
  async run(script: string, options?: { timeout?: number }): Promise<AdapterResponse<PuppeteerResult>> {
    const startTime = Date.now();
    const adapter = 'PuppeteerEngine';

    try {
      if (!script) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'INVALID_INPUT');
        return makeError('INVALID_INPUT', { reason: 'script required' }, adapter, startTime);
      }

      // TODO: Call actual Puppeteer execution engine
      // For now, simulate a valid response
      const mockResult = {
        success: true,
        logs: ['Starting Puppeteer', 'Executing script', 'Complete'],
      };

      // Validate against schema
      const parsed = PuppeteerResultSchema.safeParse(mockResult);
      if (!parsed.success) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'PUPPETEER_INVALID_RESULT');
        metricsExporter.recordSchemaViolation(adapter, 'result');
        return makeError(
          'PUPPETEER_INVALID_RESULT',
          { reason: 'schema validation failed', errors: parsed.error },
          adapter,
          startTime
        );
      }

      // Guard: detect crash markers in logs
      if (detectCrashInLogs(parsed.data.logs)) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'PUPPETEER_CRASHED');
        return makeError(
          'PUPPETEER_CRASHED',
          { reason: 'crash markers detected in logs', logs: parsed.data.logs },
          adapter,
          startTime
        );
      }

      // If crash detected, force success=false
      const result: PuppeteerResult = {
        success: parsed.data.success,
        logs: parsed.data.logs,
      };

      if (!result.success) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'PUPPETEER_FAILED');
        return makeError(
          'PUPPETEER_FAILED',
          { reason: 'Puppeteer execution failed', logs: result.logs },
          adapter,
          startTime
        );
      }

      const durationMs = Date.now() - startTime;
      metricsExporter.recordAdapterCall(adapter, durationMs, 'success');
      return makeSuccess(result, adapter, startTime);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
      metricsExporter.recordAdapterError(adapter, 'PUPPETEER_FAILED');
      return makeError(
        'PUPPETEER_FAILED',
        { reason: err instanceof Error ? err.message : 'unknown error' },
        adapter,
        startTime
      );
    }
  }
}
