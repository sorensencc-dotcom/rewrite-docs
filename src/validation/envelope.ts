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

export function makeSuccess<T>(data: T, adapter: string, startTime: number): AdapterResponse<T> {
  return {
    ok: true,
    data,
    meta: {
      adapter,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    },
  };
}

export function makeError(
  code: string,
  details: any,
  adapter: string,
  startTime: number
): AdapterResponse<never> {
  return {
    ok: false,
    error: {
      code,
      message: code,
      details,
    },
    meta: {
      adapter,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    },
  };
}
