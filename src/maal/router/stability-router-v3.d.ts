export declare function computeStabilityPenalty(driftScore: number): number;
export declare class StabilityRouterV3 {
    evaluate(driftScore: number): {
        requiresEscalation: boolean;
        penaltyScore: number;
        reason: string;
    };
}
//# sourceMappingURL=stability-router-v3.d.ts.map