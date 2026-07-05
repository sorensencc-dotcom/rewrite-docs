/**
 * Usage & Cost Ledger
 * Append-only JSON ledger tracking all LLM calls with tokens, cost, and metadata
 */
export interface LedgerEntry {
    ts: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    totalTokens: number;
    cost: number;
    source: string;
    stage: string;
    agent: string;
    jobId?: string;
    local: boolean;
    env?: 'dev' | 'prod';
}
export interface DailySummary {
    dailyTokens: number;
    dailyCost: number;
    dailySavings: number;
    weeklyTokens: number;
    weeklyCost: number;
    weeklySavings: number;
    emaTokens: number;
    emaCost: number;
    byStage: Record<string, number>;
    byAgent: Record<string, {
        tokens: number;
        cost: number;
        savings: number;
    }>;
}
declare class UsageLedgerClass {
    private ledgerPath;
    constructor();
    private ensureLedger;
    log(entry: LedgerEntry): void;
    private readEntries;
    getDailySummary(): DailySummary;
    private getEMA;
    getProjection(days?: number): {
        tokens: number;
        cost: number;
    };
}
export declare const UsageLedger: UsageLedgerClass;
export {};
//# sourceMappingURL=UsageLedger.d.ts.map