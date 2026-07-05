export declare class SnapshotManager {
    createSnapshot(vmId: string, memoryFilePath: string, snapshotFilePath: string): Promise<{
        snapshotHash: string;
        fsHash: string;
        envHash: string;
    }>;
    restoreSnapshot(vmId: string, snapshotHash: string): Promise<void>;
    private hashFileStream;
}
//# sourceMappingURL=firecracker-snapshot.d.ts.map