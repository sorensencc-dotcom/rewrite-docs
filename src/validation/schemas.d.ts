/**
 * Zod schemas for adapter result validation
 * Every adapter output validated before wrapping
 */
import { z } from 'zod';
export declare const NavigateResultSchema: z.ZodObject<{
    url: z.ZodString;
    status: z.ZodNullable<z.ZodNumber>;
    redirected: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    url: string;
    status: number | null;
    redirected: boolean;
}, {
    url: string;
    status: number | null;
    redirected: boolean;
}>;
export type NavigateResult = z.infer<typeof NavigateResultSchema>;
export declare const ScreenshotResultSchema: z.ZodObject<{
    base64: z.ZodString;
    width: z.ZodNumber;
    height: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    base64: string;
    width: number;
    height: number;
}, {
    base64: string;
    width: number;
    height: number;
}>;
export type ScreenshotResult = z.infer<typeof ScreenshotResultSchema>;
export declare const ModelGenerateResultSchema: z.ZodObject<{
    text: z.ZodString;
    tokens: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    text: string;
    tokens: number;
}, {
    text: string;
    tokens: number;
}>;
export type ModelGenerateResult = z.infer<typeof ModelGenerateResultSchema>;
export declare const AnthropicResultSchema: z.ZodObject<{
    text: z.ZodString;
    stopReason: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    stopReason: string | null;
}, {
    text: string;
    stopReason: string | null;
}>;
export type AnthropicResult = z.infer<typeof AnthropicResultSchema>;
export declare const PuppeteerResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    logs: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    logs: string[];
}, {
    success: boolean;
    logs: string[];
}>;
export type PuppeteerResult = z.infer<typeof PuppeteerResultSchema>;
export declare const AdapterResponseSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: any;
    }, {
        code: string;
        message: string;
        details?: any;
    }>>;
    meta: z.ZodObject<{
        adapter: z.ZodString;
        durationMs: z.ZodNumber;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        adapter: string;
        timestamp: string;
        durationMs: number;
    }, {
        adapter: string;
        timestamp: string;
        durationMs: number;
    }>;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    meta: {
        adapter: string;
        timestamp: string;
        durationMs: number;
    };
    data?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    } | undefined;
}, {
    ok: boolean;
    meta: {
        adapter: string;
        timestamp: string;
        durationMs: number;
    };
    data?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    } | undefined;
}>;
export type AdapterResponse<T = any> = z.infer<typeof AdapterResponseSchema> & {
    data?: T;
};
export declare const BookStackPageMetadataSchema: z.ZodObject<{
    phase: z.ZodOptional<z.ZodNumber>;
    commit: z.ZodOptional<z.ZodString>;
    generated_by: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
    artifact_type: z.ZodOptional<z.ZodString>;
    component: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timestamp?: string | undefined;
    phase?: number | undefined;
    commit?: string | undefined;
    generated_by?: string | undefined;
    artifact_type?: string | undefined;
    component?: string | undefined;
}, {
    timestamp?: string | undefined;
    phase?: number | undefined;
    commit?: string | undefined;
    generated_by?: string | undefined;
    artifact_type?: string | undefined;
    component?: string | undefined;
}>;
export type BookStackPageMetadata = z.infer<typeof BookStackPageMetadataSchema>;
export declare const BookStackPageSchema: z.ZodObject<{
    page_id: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodObject<{
        phase: z.ZodOptional<z.ZodNumber>;
        commit: z.ZodOptional<z.ZodString>;
        generated_by: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodString>;
        artifact_type: z.ZodOptional<z.ZodString>;
        component: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp?: string | undefined;
        phase?: number | undefined;
        commit?: string | undefined;
        generated_by?: string | undefined;
        artifact_type?: string | undefined;
        component?: string | undefined;
    }, {
        timestamp?: string | undefined;
        phase?: number | undefined;
        commit?: string | undefined;
        generated_by?: string | undefined;
        artifact_type?: string | undefined;
        component?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    title: string;
    page_id: string;
    metadata?: {
        timestamp?: string | undefined;
        phase?: number | undefined;
        commit?: string | undefined;
        generated_by?: string | undefined;
        artifact_type?: string | undefined;
        component?: string | undefined;
    } | undefined;
}, {
    content: string;
    title: string;
    page_id: string;
    metadata?: {
        timestamp?: string | undefined;
        phase?: number | undefined;
        commit?: string | undefined;
        generated_by?: string | undefined;
        artifact_type?: string | undefined;
        component?: string | undefined;
    } | undefined;
}>;
export type BookStackPage = z.infer<typeof BookStackPageSchema>;
export declare const BookStackUpsertResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["created", "updated"]>;
    version: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "created" | "updated";
    version?: number | undefined;
}, {
    id: string;
    status: "created" | "updated";
    version?: number | undefined;
}>;
export type BookStackUpsertResponse = z.infer<typeof BookStackUpsertResponseSchema>;
export declare const BookStackSearchResultsSchema: z.ZodObject<{
    query: z.ZodString;
    results: z.ZodArray<z.ZodObject<{
        page_id: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodObject<{
            phase: z.ZodOptional<z.ZodNumber>;
            commit: z.ZodOptional<z.ZodString>;
            generated_by: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodString>;
            artifact_type: z.ZodOptional<z.ZodString>;
            component: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            timestamp?: string | undefined;
            phase?: number | undefined;
            commit?: string | undefined;
            generated_by?: string | undefined;
            artifact_type?: string | undefined;
            component?: string | undefined;
        }, {
            timestamp?: string | undefined;
            phase?: number | undefined;
            commit?: string | undefined;
            generated_by?: string | undefined;
            artifact_type?: string | undefined;
            component?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        title: string;
        page_id: string;
        metadata?: {
            timestamp?: string | undefined;
            phase?: number | undefined;
            commit?: string | undefined;
            generated_by?: string | undefined;
            artifact_type?: string | undefined;
            component?: string | undefined;
        } | undefined;
    }, {
        content: string;
        title: string;
        page_id: string;
        metadata?: {
            timestamp?: string | undefined;
            phase?: number | undefined;
            commit?: string | undefined;
            generated_by?: string | undefined;
            artifact_type?: string | undefined;
            component?: string | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    query: string;
    results: {
        content: string;
        title: string;
        page_id: string;
        metadata?: {
            timestamp?: string | undefined;
            phase?: number | undefined;
            commit?: string | undefined;
            generated_by?: string | undefined;
            artifact_type?: string | undefined;
            component?: string | undefined;
        } | undefined;
    }[];
}, {
    query: string;
    results: {
        content: string;
        title: string;
        page_id: string;
        metadata?: {
            timestamp?: string | undefined;
            phase?: number | undefined;
            commit?: string | undefined;
            generated_by?: string | undefined;
            artifact_type?: string | undefined;
            component?: string | undefined;
        } | undefined;
    }[];
}>;
export type BookStackSearchResults = z.infer<typeof BookStackSearchResultsSchema>;
export declare const BookStackHealthStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["ok", "degraded", "down"]>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "ok" | "degraded" | "down";
    details?: Record<string, any> | undefined;
}, {
    status: "ok" | "degraded" | "down";
    details?: Record<string, any> | undefined;
}>;
export type BookStackHealthStatus = z.infer<typeof BookStackHealthStatusSchema>;
//# sourceMappingURL=schemas.d.ts.map