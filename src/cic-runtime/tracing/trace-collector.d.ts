import { NetworkTraceEvent } from './network-tracer';
import { SyscallTraceEvent } from './syscall-tracer';
export interface FileAccessEvent {
    file: string;
    result: number;
    error_code: string | null;
}
export interface CollectedTrace {
    networkTrace: NetworkTraceEvent[];
    syscallTrace: SyscallTraceEvent[];
    fileAccess: FileAccessEvent[];
}
export declare class TraceCollector {
    private vmId;
    private networkTracer;
    private syscallTracer;
    constructor(vmId: string);
    startTracing(): Promise<void>;
    collectTrace(): Promise<CollectedTrace>;
}
//# sourceMappingURL=trace-collector.d.ts.map