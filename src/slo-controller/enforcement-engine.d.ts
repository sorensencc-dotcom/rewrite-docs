import { SLOController } from "./slo-controller";
export interface EnforcementAction {
    type: 'none' | 'abort' | 'rollback';
    reason: string;
    timestamp: number;
}
export declare class EnforcementEngine {
    private controller;
    private criticalBurnRateThreshold;
    private lastAbortTs;
    private abortCooldownMs;
    constructor(controller: SLOController);
    enforce(): Promise<EnforcementAction>;
    private handleCriticalViolation;
}
//# sourceMappingURL=enforcement-engine.d.ts.map