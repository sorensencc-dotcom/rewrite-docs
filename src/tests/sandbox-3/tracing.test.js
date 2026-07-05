import { TraceCollector } from '../../cic-runtime/tracing/trace-collector';
describe('Tracing Layer', () => {
    it('should collect network and syscall events natively in test mode', async () => {
        process.env.NODE_ENV = 'test';
        const collector = new TraceCollector('test-vm');
        await collector.startTracing();
        const trace = await collector.collectTrace();
        expect(trace.networkTrace.length).toBeGreaterThan(0);
        expect(trace.syscallTrace.length).toBeGreaterThan(0);
        expect(trace.fileAccess).toBeDefined();
        expect(trace.fileAccess[0].file).toBe('/etc/passwd');
        expect(trace.fileAccess[0].error_code).toBe('EACCES');
    });
});
//# sourceMappingURL=tracing.test.js.map