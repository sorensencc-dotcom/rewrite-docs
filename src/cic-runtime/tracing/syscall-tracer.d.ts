export interface SyscallTraceEvent {
    timestamp: string;
    syscall: string;
    args_json: string;
    result: number;
    error_code: string | null;
}
export declare class SyscallTracer {
    private vmId;
    private activeTrace;
    private stracePid;
    constructor(vmId: string);
    start(): Promise<void>;
    stop(): Promise<SyscallTraceEvent[]>;
}
//# sourceMappingURL=syscall-tracer.d.ts.map