import { CollectedTrace } from "../tracing/trace-collector";
export interface S3ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    latencyMs: number;
    traceData?: CollectedTrace;
    reproducibility?: {
        snapshotHash: string;
        fsHash: string;
        envHash: string;
        vmConfigHash: string;
    };
}
export declare function executeS3(code: string, options: {
    seed?: number;
    timeoutMs?: number;
    createSnapshot?: boolean;
    collectTrace?: boolean;
}): Promise<S3ExecutionResult>;
//# sourceMappingURL=s3-exec-firecracker-v3.d.ts.map