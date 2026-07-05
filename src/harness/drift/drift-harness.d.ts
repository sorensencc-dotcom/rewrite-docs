export declare function runDriftHarness(): Promise<{
    embedding: {
        drift: number;
        passed: boolean;
    };
    preprocessing: {
        passed: boolean;
    };
    onnx: {
        drift: number;
        passed: boolean;
    };
    routing: {
        passed: boolean;
    };
    snapshot: {
        snapshot: boolean;
        fs: boolean;
        env: boolean;
        passed: boolean;
    };
    passed: boolean;
}>;
//# sourceMappingURL=drift-harness.d.ts.map