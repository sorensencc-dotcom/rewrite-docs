export interface FirecrackerConfig {
    'boot-source': any;
    drives: any[];
    'machine-config': any;
    'network-interfaces': any[];
    vsock: any;
    metadata: any;
}
export declare function buildConfig(vmId: string, kernelPath: string, rootfsPath: string, seed?: number): {
    configPath: string;
    vmConfigHash: string;
};
//# sourceMappingURL=firecracker-config.d.ts.map