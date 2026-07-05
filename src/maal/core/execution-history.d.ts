import { RunManifestV3 } from '../../cic-runtime/sandbox-exec/execution-manifest';
export declare class ExecutionHistory {
    getMetrics(modelId: string): Promise<{
        driftScore: number;
        p99Latency: number;
        reproScore: number;
    }>;
    recordRun(modelId: string, manifest: RunManifestV3): Promise<void>;
}
//# sourceMappingURL=execution-history.d.ts.map