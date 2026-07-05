/**
 * ModelGenerateAdapter: Wraps model.generate() output
 * Validates: text content, token counts, JSON completeness if expected
 */
import { makeSuccess, makeError } from '../validation/envelope';
import { sanitizeText, validateTextLength, validateJsonCompleteness } from '../validation/guards';
import { ModelGenerateResultSchema } from '../validation/schemas';
import { metricsExporter } from '../metrics/MetricsExporter';
export class ModelGenerateAdapter {
    async run(prompt, options) {
        const startTime = Date.now();
        const adapter = 'ModelGenerate';
        try {
            if (!prompt) {
                const durationMs = Date.now() - startTime;
                metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
                metricsExporter.recordAdapterError(adapter, 'INVALID_INPUT');
                return makeError('INVALID_INPUT', { reason: 'prompt required' }, adapter, startTime);
            }
            // TODO: Call actual model.generate(prompt)
            // For now, simulate a valid response
            const mockResult = {
                text: 'Generated response text',
                tokens: 15,
            };
            // Validate against schema
            const parsed = ModelGenerateResultSchema.safeParse(mockResult);
            if (!parsed.success) {
                const durationMs = Date.now() - startTime;
                metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
                metricsExporter.recordAdapterError(adapter, 'MODEL_INVALID_OUTPUT');
                metricsExporter.recordSchemaViolation(adapter, 'result');
                return makeError('MODEL_INVALID_OUTPUT', { reason: 'schema validation failed', errors: parsed.error }, adapter, startTime);
            }
            let text = parsed.data.text;
            // Guard: sanitize text
            text = sanitizeText(text);
            // Guard: validate length
            if (!validateTextLength(text)) {
                const durationMs = Date.now() - startTime;
                metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
                metricsExporter.recordAdapterError(adapter, 'MODEL_OVERSIZE_OUTPUT');
                return makeError('MODEL_OVERSIZE_OUTPUT', { reason: 'text exceeds size limits', length: text.length }, adapter, startTime);
            }
            // Guard: validate JSON if expected
            if (options?.expectJson && !validateJsonCompleteness(text)) {
                const durationMs = Date.now() - startTime;
                metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
                metricsExporter.recordAdapterError(adapter, 'MODEL_INVALID_JSON');
                return makeError('MODEL_INVALID_JSON', { reason: 'expected valid JSON, got invalid' }, adapter, startTime);
            }
            const result = {
                text,
                tokens: parsed.data.tokens,
            };
            const durationMs = Date.now() - startTime;
            metricsExporter.recordAdapterCall(adapter, durationMs, 'success');
            return makeSuccess(result, adapter, startTime);
        }
        catch (err) {
            const durationMs = Date.now() - startTime;
            metricsExporter.recordAdapterCall(adapter, durationMs, 'error');
            metricsExporter.recordAdapterError(adapter, 'MODEL_GENERATE_FAILED');
            return makeError('MODEL_GENERATE_FAILED', { reason: err instanceof Error ? err.message : 'unknown error' }, adapter, startTime);
        }
    }
}
//# sourceMappingURL=ModelGenerateAdapter.js.map