export declare class FirecrackerVsock {
    private vmId;
    private socketPath;
    constructor(vmId: string);
    sendCommand(command: string, timeoutMs?: number): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
    }>;
}
//# sourceMappingURL=firecracker-vsock.d.ts.map