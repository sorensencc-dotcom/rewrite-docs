import { FirecrackerRuntime } from "../firecracker/firecracker-runtime";
import { runJailer } from "../firecracker/firecracker-jailer";
import { FirecrackerVsock } from "../firecracker/firecracker-vsock";
import { SnapshotManager } from "../firecracker/firecracker-snapshot";
import { prepareDeterministicEnv } from "../repro/deterministic-env";
import { TraceCollector, CollectedTrace } from "../tracing/trace-collector";
import { ingestTrace } from "../tracing/trace-ingest";
import * as crypto from 'crypto';

export interface S3ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  latencyMs: number;
  traceData?: CollectedTrace;
  reproducibility?: {
    snapshotHash: string;
    fsHash: string;
    envHash: string;
    vmConfigHash: string;
  };
}

export async function executeS3(
  code: string,
  options: { seed?: number, timeoutMs?: number, createSnapshot?: boolean, collectTrace?: boolean }
): Promise<S3ExecutionResult> {
  const startTime = Date.now();
  const runId = `run-${crypto.randomBytes(4).toString('hex')}`;
  const vmId = `vm-${runId}`;
  
  const { env, envHash } = prepareDeterministicEnv(options.seed);
  const runtime = new FirecrackerRuntime(vmId, "/var/lib/firecracker/vmlinux", "/var/lib/firecracker/rootfs.ext4", {});
  
  await runJailer(vmId, { uid: 1000, gid: 1000 });
  const vmConfigHash = await runtime.boot(options.seed) as string;
  
  const tracer = new TraceCollector(vmId);
  if (options.collectTrace) {
    await tracer.startTracing();
  }

  const vsock = new FirecrackerVsock(vmId);
  if (options.seed !== undefined) {
    await vsock.sendCommand(`export CIC_SEED=${options.seed}`);
  }
  
  const result = await vsock.sendCommand(code, options.timeoutMs || 10000);
  const latencyMs = Date.now() - startTime;
  
  let traceData: CollectedTrace | undefined;
  if (options.collectTrace) {
    traceData = await tracer.collectTrace();
    try {
      await ingestTrace(runId, traceData);
    } catch (e) {
      console.warn(`[ExecuteS3] Trace ingest failed for ${runId}`, e);
    }
  }

  const snapshotMgr = new SnapshotManager();
  let reproducibilityMetadata;
  if (options.createSnapshot) {
    const snap = await snapshotMgr.createSnapshot(
      vmId, 
      `/tmp/mem_${vmId}.snap`, 
      `/tmp/vm_${vmId}.snap`
    );
    reproducibilityMetadata = { ...snap, vmConfigHash };
  } else {
    reproducibilityMetadata = { snapshotHash: "", fsHash: "", envHash, vmConfigHash };
  }
  
  await runtime.teardown();
  
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    latencyMs,
    traceData,
    reproducibility: reproducibilityMetadata
  };
}
