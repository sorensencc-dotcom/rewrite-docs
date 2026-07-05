import { S3ExecutionResult } from './s3-exec-firecracker-v3';
import { RunManifestV3 } from './execution-manifest';
export declare class ExecutionHarnessV3 {
    private sloBudgetMs;
    constructor(sloBudgetMs: number);
    run(code: string, options: {
        runId: string;
        modelId: string;
        seed?: number;
        collectTrace?: boolean;
    }): Promise<{
        result: S3ExecutionResult;
        manifest: RunManifestV3;
    }>;
}
//# sourceMappingURL=cic-execution-harness-v3.d.ts.map