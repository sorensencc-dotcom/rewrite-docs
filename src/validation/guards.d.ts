/**
 * Guard functions: post-execution safety checks
 * Used by adapters to validate output before wrapping
 */
export declare function validateFinalUrl(url: any): boolean;
export declare function validatePng(base64: string): boolean;
export declare function validateScreenshotSize(base64: string): boolean;
export declare function sanitizeText(text: string): string;
export declare function validateTextLength(text: string): boolean;
export declare function validateJsonCompleteness(json: string): boolean;
export declare function detectCrashInLogs(logs: string[]): boolean;
export declare function validatePageContent(content: string): void;
//# sourceMappingURL=guards.d.ts.map