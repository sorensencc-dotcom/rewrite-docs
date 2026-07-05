import { executeS3 } from './s3-exec-firecracker-v3';
import { LatencySloManager } from './latency-slo-manager';
import { KillSwitch } from './kill-switch';
import { HardTimeoutError } from './timeout-errors';
export class ExecutionHarnessV3 {
    sloBudgetMs;
    constructor(sloBudgetMs) {
        this.sloBudgetMs = sloBudgetMs;
    }
    async run(code, options) {
        const sloManager = new LatencySloManager(this.sloBudgetMs);
        // We give the VM an absolute hard limit of sloBudgetMs + 5000ms padding before KillSwitch triggers
        const hardTimeoutMs = this.sloBudgetMs + 5000;
        let execResult;
        try {
            execResult = await KillSwitch.enforce(executeS3(code, {
                seed: options.seed,
                timeoutMs: hardTimeoutMs,
                createSnapshot: true,
                collectTrace: options.collectTrace
            }), hardTimeoutMs);
        }
        catch (err) {
            console.error(`[ExecutionHarnessV3] ${err}`);
            if (err.message && err.message.includes('Hard execution timeout')) {
                throw new HardTimeoutError(err.message);
            }
            throw err;
        }
        const sloStatus = sloManager.enforce(execResult.latencyMs);
        if (sloStatus.violated) {
            console.warn(`[ExecutionHarnessV3] SLO Violated by ${sloStatus.exceededByMs}ms`);
        }
        const manifest = {
            runId: options.runId,
            sandboxTier: 'S3',
            modelId: options.modelId,
            exitCode: execResult.exitCode,
            latencyMs: execResult.latencyMs,
            sloViolated: sloStatus.violated,
            reproducibility: execResult.reproducibility,
            telemetry: {
                networkEvents: execResult.traceData ? execResult.traceData.networkTrace.length : 0,
                syscallEvents: execResult.traceData ? execResult.traceData.syscallTrace.length : 0,
                fileAccessEvents: execResult.traceData ? execResult.traceData.fileAccess.length : 0
            }
        };
        return { result: execResult, manifest };
    }
}
//# sourceMappingURL=cic-execution-harness-v3.js.map