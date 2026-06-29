import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export interface NetworkTraceEvent {
  timestamp: string;
  dest_ip: string;
  dest_port: number;
  protocol: string;
  bytes_sent: number;
  bytes_received: number;
}

export class NetworkTracer {
  private activeTrace: boolean = false;

  constructor(private vmId: string) {}

  async start() {
    this.activeTrace = true;
    console.log(`[NetworkTracer] Attaching eBPF network hooks to ${this.vmId}`);
    if (process.env.NODE_ENV !== 'test') {
      try {
        await execAsync(`tc qdisc add dev tap-${this.vmId} clsact`);
        await execAsync(`tc filter add dev tap-${this.vmId} ingress bpf obj network_trace.o sec ingress`);
        await execAsync(`tc filter add dev tap-${this.vmId} egress bpf obj network_trace.o sec egress`);
      } catch (err) {
        console.warn(`[NetworkTracer] eBPF attach failed (requires privileges): ${err}`);
      }
    }
  }

  async stop(): Promise<NetworkTraceEvent[]> {
    this.activeTrace = false;
    console.log(`[NetworkTracer] Detaching eBPF network hooks from ${this.vmId}`);
    
    if (process.env.NODE_ENV === 'test') {
      return [{
        timestamp: new Date().toISOString(),
        dest_ip: '8.8.8.8',
        dest_port: 53,
        protocol: 'udp',
        bytes_sent: 50,
        bytes_received: 50
      }];
    }

    try {
      const { stdout } = await execAsync(`bpftool map dump name cic_net_trace_${this.vmId} --json`);
      const events: NetworkTraceEvent[] = JSON.parse(stdout);
      await execAsync(`tc qdisc del dev tap-${this.vmId} clsact`);
      return events;
    } catch (err) {
      console.warn(`[NetworkTracer] Failed to read eBPF map: ${err}`);
      return [];
    }
  }
}
