/**
 * API: Query audit log with optional filters.
 */
export declare function getAuditLog(filters: {
    modelId?: string;
    sandboxTier?: string;
    minDrift?: number;
    maxDrift?: number;
}): Promise<any>;
//# sourceMappingURL=get-audit-log.d.ts.map