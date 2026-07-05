export declare class MaalOrchestratorV3 {
    private executionHistory;
    private tierEscalation;
    constructor(sloBudgetMs: number);
    executePayload(modelId: string, payload: string, seed: number): Promise<{
        result: import("../../cic-runtime/sandbox-exec/s3-exec-firecracker-v3").S3ExecutionResult;
        manifest: import("../../cic-runtime/sandbox-exec/execution-manifest").RunManifestV3;
    }>;
}
//# sourceMappingURL=maal-orchestrator-v3.d.ts.map