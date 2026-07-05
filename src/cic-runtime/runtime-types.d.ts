/**
 * EnvironmentSnapshot:
 * Captures the environment metadata for a sandbox execution.
 * Phase Sandbox‑1 uses simulated values for S0/S1 and stubs for S2/S3.
 */
export interface EnvironmentSnapshot {
    osImageHash: string;
    runtimeVersions: Record<string, string>;
    libraryHashes: Record<string, string>;
    seed: number;
    modelVersion: string;
    sandboxIsolationLevel: "container" | "hardened_container" | "microvm" | "microvm_offline";
    sandboxDeterminism: "low" | "medium" | "medium_high" | "high";
    sandboxNetwork: "off" | "allowlist" | "strict" | "none";
    sandboxCostTier: "lowest" | "low" | "medium" | "highest";
}
/**
 * InputSnapshot:
 * Captures the code + config passed into the sandbox.
 */
export interface InputSnapshot {
    code: string;
    config: Record<string, unknown>;
}
/**
 * ExecutionResult:
 * Captures the result of sandbox execution.
 */
export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    resourceUsage: {
        cpuMs: number;
        memoryMb: number;
        wallTimeMs: number;
    };
    networkCalls: string[];
    violation?: {
        type: "resource" | "isolation" | "determinism" | "unknown";
        details?: string;
    };
}
/**
 * TelemetrySnapshot:
 * Captures SLO compliance + drift metadata.
 * Phase Sandbox‑1 uses minimal stubs.
 */
export interface TelemetrySnapshot {
    sloCompliance: {
        latency: boolean;
        isolation: boolean;
        reliability: boolean;
    };
    modelOutput: string;
    driftScore: number;
}
//# sourceMappingURL=runtime-types.d.ts.map