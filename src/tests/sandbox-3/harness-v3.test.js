import { ExecutionHarnessV3 } from '../../cic-runtime/sandbox-exec/cic-execution-harness-v3';
describe('Execution Harness V3', () => {
    beforeEach(() => {
        process.env.NODE_ENV = 'test';
    });
    it('should orchestrate a complete V3 run and produce a RunManifest', async () => {
        const harness = new ExecutionHarnessV3(500); // 500ms SLO
        const { manifest } = await harness.run('echo hello', {
            runId: 'run-123',
            modelId: 'model-a',
            seed: 42,
            collectTrace: true
        });
        expect(manifest.runId).toBe('run-123');
        expect(manifest.sandboxTier).toBe('S3');
        expect(manifest.sloViolated).toBe(false);
        expect(manifest.reproducibility.envHash).toBeDefined();
        expect(manifest.telemetry.syscallEvents).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=harness-v3.test.js.map