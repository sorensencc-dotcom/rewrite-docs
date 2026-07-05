import { MAALRouteRequest } from "../maal/router/maal-router-types";
import { EnvironmentSnapshot, InputSnapshot, ExecutionResult } from "./runtime-types";
/**
 * Provision a sandbox environment for S0/S1.
 * S2/S3 are stubbed for Phase Sandbox‑1.
 */
export declare function provisionSandboxEnvironment(tier: "S0" | "S1" | "S2" | "S3", modelId: string): Promise<EnvironmentSnapshot>;
/**
 * Execute code inside a sandbox.
 * S0/S1 use `docker run` via child_process.
 * S2/S3 are stubbed for Phase Sandbox‑1.
 */
export declare function executeInSandbox(env: EnvironmentSnapshot, input: InputSnapshot): Promise<ExecutionResult>;
/**
 * Main CIC execution harness.
 * This is the orchestrator for Phase Sandbox‑1.
 */
export declare function runCICExecutionHarness(req: MAALRouteRequest, input: InputSnapshot): Promise<import("../cic/types/run-manifest").RunManifest>;
//# sourceMappingURL=cic-execution-harness.d.ts.map