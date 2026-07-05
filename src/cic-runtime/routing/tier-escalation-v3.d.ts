export type SandboxTier = 'S1' | 'S2' | 'S3';
export declare class TierEscalationV3 {
    private stabilityRouter;
    private latencyRouter;
    private reproRouter;
    constructor(sloBudgetMs: number);
    determineTier(baseTier: SandboxTier, driftScore: number, historicalP99: number, historicalReproScore: number): {
        targetTier: SandboxTier;
        escalationReasons: string[];
    };
}
//# sourceMappingURL=tier-escalation-v3.d.ts.map