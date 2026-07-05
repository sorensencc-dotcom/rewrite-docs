export declare class AgentRoutingProfile {
    private readonly preferredModels;
    private readonly fallbackModels;
    readonly mode?: "local" | "hybrid" | "cloud" | undefined;
    constructor(preferredModels: string[], fallbackModels?: string[], mode?: "local" | "hybrid" | "cloud" | undefined);
    pickModel(): string;
    private computeModelScore;
    private validateModels;
}
//# sourceMappingURL=routingProfile.d.ts.map