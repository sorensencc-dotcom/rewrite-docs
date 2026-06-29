/**
 * Zod schemas for adapter result validation
 * Every adapter output validated before wrapping
 */

import { z } from 'zod';

// Browser adapter results
export const NavigateResultSchema = z.object({
  url: z.string().url(),
  status: z.number().int().nullable(),
  redirected: z.boolean(),
});

export type NavigateResult = z.infer<typeof NavigateResultSchema>;

export const ScreenshotResultSchema = z.object({
  base64: z.string(),
  width: z.number().int(),
  height: z.number().int(),
});

export type ScreenshotResult = z.infer<typeof ScreenshotResultSchema>;

// Model/LLM adapter results
export const ModelGenerateResultSchema = z.object({
  text: z.string().min(1),
  tokens: z.number().int().min(1),
});

export type ModelGenerateResult = z.infer<typeof ModelGenerateResultSchema>;

export const AnthropicResultSchema = z.object({
  text: z.string(),
  stopReason: z.string().nullable(),
});

export type AnthropicResult = z.infer<typeof AnthropicResultSchema>;

// Orchestration adapter result
export const PuppeteerResultSchema = z.object({
  success: z.boolean(),
  logs: z.array(z.string()),
});

export type PuppeteerResult = z.infer<typeof PuppeteerResultSchema>;

// Generic adapter response wrapper
export const AdapterResponseSchema = z.object({
  ok: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  meta: z.object({
    adapter: z.string(),
    durationMs: z.number(),
    timestamp: z.string(),
  }),
});

export type AdapterResponse<T = any> = z.infer<typeof AdapterResponseSchema> & {
  data?: T;
};

// BookStack adapter schemas
export const BookStackPageMetadataSchema = z.object({
  phase: z.number().int().optional(),
  commit: z.string().optional(),
  generated_by: z.string().optional(),
  timestamp: z.string().optional(),
  artifact_type: z.string().optional(),
  component: z.string().optional(),
});

export type BookStackPageMetadata = z.infer<typeof BookStackPageMetadataSchema>;

export const BookStackPageSchema = z.object({
  page_id: z.string(),
  title: z.string(),
  content: z.string(),
  metadata: BookStackPageMetadataSchema.optional(),
});

export type BookStackPage = z.infer<typeof BookStackPageSchema>;

export const BookStackUpsertResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['created', 'updated']),
  version: z.number().int().optional(),
});

export type BookStackUpsertResponse = z.infer<typeof BookStackUpsertResponseSchema>;

export const BookStackSearchResultsSchema = z.object({
  query: z.string(),
  results: z.array(BookStackPageSchema),
});

export type BookStackSearchResults = z.infer<typeof BookStackSearchResultsSchema>;

export const BookStackHealthStatusSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  details: z.record(z.any()).optional(),
});

export type BookStackHealthStatus = z.infer<typeof BookStackHealthStatusSchema>;

