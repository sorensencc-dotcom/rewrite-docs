export interface RollbackResult {
    success: boolean;
    previousVersion: string | null;
    completeMs: number;
    rolledBackAt: number;
    error?: string;
}
export declare function executeCanaryRollback(proposalId: string): Promise<RollbackResult>;
//# sourceMappingURL=canary-rollback.d.ts.map