/**
 * Envelope helpers for standardized adapter responses
 * All adapters wrap output with success/error structure
 */
export interface Meta {
    adapter: string;
    durationMs: number;
    timestamp: string;
}
export interface ErrorDetail {
    code: string;
    message: string;
    details?: any;
}
export interface AdapterResponse<T = any> {
    ok: boolean;
    data?: T;
    error?: ErrorDetail;
    meta: Meta;
}
export declare function makeSuccess<T>(data: T, adapter: string, startTime: number): AdapterResponse<T>;
export declare function makeError(code: string, details: any, adapter: string, startTime: number): AdapterResponse<never>;
//# sourceMappingURL=envelope.d.ts.map