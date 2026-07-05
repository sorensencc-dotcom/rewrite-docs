export declare function runJailer(vmId: string, options: {
    uid: number;
    gid: number;
    numaNode?: number;
}): Promise<{
    pid: number;
    vmDir: string;
}>;
//# sourceMappingURL=firecracker-jailer.d.ts.map