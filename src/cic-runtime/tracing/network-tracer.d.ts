export interface NetworkTraceEvent {
    timestamp: string;
    dest_ip: string;
    dest_port: number;
    protocol: string;
    bytes_sent: number;
    bytes_received: number;
}
export declare class NetworkTracer {
    private vmId;
    private activeTrace;
    constructor(vmId: string);
    start(): Promise<void>;
    stop(): Promise<NetworkTraceEvent[]>;
}
//# sourceMappingURL=network-tracer.d.ts.map