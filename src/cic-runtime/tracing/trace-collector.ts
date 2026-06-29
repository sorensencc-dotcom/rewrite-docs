import { NetworkTracer, NetworkTraceEvent } from './network-tracer';
import { SyscallTracer, SyscallTraceEvent } from './syscall-tracer';

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

export class TraceCollector {
  private networkTracer: NetworkTracer;
  private syscallTracer: SyscallTracer;

  constructor(private vmId: string) {
    this.networkTracer = new NetworkTracer(vmId);
    this.syscallTracer = new SyscallTracer(vmId);
  }

  async startTracing() {
    await Promise.all([
      this.networkTracer.start(),
      this.syscallTracer.start()
    ]);
  }

  async collectTrace(): Promise<CollectedTrace> {
    const [networkTrace, syscallTrace] = await Promise.all([
      this.networkTracer.stop(),
      this.syscallTracer.stop()
    ]);

    const fileAccess: FileAccessEvent[] = syscallTrace
      .filter(s => s.syscall === 'open' || s.syscall === 'openat')
      .map(s => {
        try {
          const args = JSON.parse(s.args_json);
          return { file: args[1], result: s.result, error_code: s.error_code };
        } catch {
          return null;
        }
      })
      .filter((e): e is FileAccessEvent => e !== null);

    return {
      networkTrace,
      syscallTrace,
      fileAccess
    };
  }
}
