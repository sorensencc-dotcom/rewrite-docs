export interface RunManifestV3 {
    runId: string;
    sandboxTier: string;
    modelId: string;
    exitCode: number;
    latencyMs: number;
    sloViolated: boolean;
    reproducibility: {
        snapshotHash: string;
        fsHash: string;
        envHash: string;
        vmConfigHash: string;
    };
    telemetry: {
        networkEvents: number;
        syscallEvents: number;
        fileAccessEvents: number;
    };
}
//# sourceMappingURL=execution-manifest.d.ts.map