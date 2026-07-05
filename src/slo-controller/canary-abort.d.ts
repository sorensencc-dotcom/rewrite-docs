export interface AbortContext {
    reason: string;
    sloId?: string;
    burnRate?: number;
    threshold?: number;
    violationDetails?: Record<string, any>;
}
export declare function triggerCanaryAbort(proposalId: string | AbortContext, context?: AbortContext): Promise<void>;
//# sourceMappingURL=canary-abort.d.ts.map