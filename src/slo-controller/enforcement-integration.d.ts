export declare class EnforcementIntegration {
    private sloController;
    private enforcementEngine;
    private evaluationIntervalMs;
    private evaluationTimer;
    constructor();
    start(): Promise<void>;
    stop(): void;
    private handleViolation;
    private classifyViolation;
    getStatus(): {
        running: boolean;
        timestamp: number;
    };
}
export declare const enforcementIntegration: EnforcementIntegration;
//# sourceMappingURL=enforcement-integration.d.ts.map