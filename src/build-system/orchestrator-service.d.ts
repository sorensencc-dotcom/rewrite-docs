declare const http: any;
declare class OrchestratorService {
    constructor();
    initialize(): void;
    generateJobId(): string;
    validateBuildDAG(dag: any): {
        valid: boolean;
        error: string;
    } | {
        valid: boolean;
        error?: undefined;
    };
    createExecutionPlan(dag: any): {
        layerCount: number;
        executionOrder: any[];
    };
    executeDAG(job: any): void;
    handleRequest(req: any, res: any): void;
    start(): void;
}
declare const service: OrchestratorService;
//# sourceMappingURL=orchestrator-service.d.ts.map