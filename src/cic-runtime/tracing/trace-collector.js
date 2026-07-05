import { NetworkTracer } from './network-tracer';
import { SyscallTracer } from './syscall-tracer';
export class TraceCollector {
    vmId;
    networkTracer;
    syscallTracer;
    constructor(vmId) {
        this.vmId = vmId;
        this.networkTracer = new NetworkTracer(vmId);
        this.syscallTracer = new SyscallTracer(vmId);
    }
    async startTracing() {
        await Promise.all([
            this.networkTracer.start(),
            this.syscallTracer.start()
        ]);
    }
    async collectTrace() {
        const [networkTrace, syscallTrace] = await Promise.all([
            this.networkTracer.stop(),
            this.syscallTracer.stop()
        ]);
        const fileAccess = syscallTrace
            .filter(s => s.syscall === 'open' || s.syscall === 'openat')
            .map(s => {
            try {
                const args = JSON.parse(s.args_json);
                return { file: args[1], result: s.result, error_code: s.error_code };
            }
            catch {
                return null;
            }
        })
            .filter((e) => e !== null);
        return {
            networkTrace,
            syscallTrace,
            fileAccess
        };
    }
}
//# sourceMappingURL=trace-collector.js.map