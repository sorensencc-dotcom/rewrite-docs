/**
 * AnthropicClient: Wraps Anthropic API response
 * Validates: response structure, text content, stop reason
 */

import { makeSuccess, makeError, AdapterResponse } from '../validation/envelope';
import { sanitizeText, validateTextLength } from '../validation/guards';
import { AnthropicResultSchema, AnthropicResult } from '../validation/schemas';
import { metricsExporter } from '../metrics/MetricsExporter';

export class AnthropicClient {
  async run(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: string; maxTokens?: number }
  ): Promise<AdapterResponse<AnthropicResult>> {
    const startTime = Date.now();
    const adapter = 'AnthropicClient';

    try {
      if (!messages || messages.length === 0) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'INVALID_INPUT');
        return makeError('INVALID_INPUT', { reason: 'messages required' }, adapter, startTime);
      }

      // TODO: Call actual Anthropic API via fetch or SDK
      // For now, simulate a valid response
      const mockResult = {
        text: 'Anthropic response text',
        stopReason: 'end_turn',
      };

      // Validate against schema
      const parsed = AnthropicResultSchema.safeParse(mockResult);
      if (!parsed.success) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'ANTHROPIC_INVALID_RESPONSE');
        metricsExporter.recordSchemaViolation(adapter, 'result');
        return makeError(
          'ANTHROPIC_INVALID_RESPONSE',
          { reason: 'schema validation failed', errors: parsed.error },
          adapter,
          startTime
        );
      }

      // Guard: reject empty responses
      if (!parsed.data.text || parsed.data.text.trim().length === 0) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'ANTHROPIC_EMPTY_RESPONSE');
        return makeError(
          'ANTHROPIC_EMPTY_RESPONSE',
          { reason: 'API returned empty response' },
          adapter,
          startTime
        );
      }

      let text = parsed.data.text;

      // Guard: sanitize text
      text = sanitizeText(text);

      // Guard: validate length
      if (!validateTextLength(text)) {
        const durationMs = Date.now() - startTime;
        metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
        metricsExporter.recordAdapterError(adapter, 'ANTHROPIC_OVERSIZE_OUTPUT');
        return makeError(
          'ANTHROPIC_OVERSIZE_OUTPUT',
          { reason: 'response exceeds size limits', length: text.length },
          adapter,
          startTime
        );
      }

      const result: AnthropicResult = {
        text,
        stopReason: parsed.data.stopReason,
      };

      const durationMs = Date.now() - startTime;
      metricsExporter.recordAdapterCall(adapter, durationMs, 'success');
      return makeSuccess(result, adapter, startTime);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
      metricsExporter.recordAdapterError(adapter, 'ANTHROPIC_API_ERROR');
      return makeError(
        'ANTHROPIC_API_ERROR',
        { reason: err instanceof Error ? err.message : 'unknown error' },
        adapter,
        startTime
      );
    }
  }
}
