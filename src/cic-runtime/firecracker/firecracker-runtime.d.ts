export declare class FirecrackerRuntime {
    private vmId;
    private kernelPath;
    private rootfsPath;
    private jailerOptions;
    private vmProcess;
    private state;
    constructor(vmId: string, kernelPath: string, rootfsPath: string, jailerOptions: any);
    boot(seed?: number): Promise<unknown>;
    teardown(): Promise<void>;
}
//# sourceMappingURL=firecracker-runtime.d.ts.map