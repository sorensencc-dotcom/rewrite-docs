import { SandboxTierId } from "../../cic/types/run-manifest";
/**
 * Sandbox violation types reported by the execution harness.
 */
export interface SandboxRunResult {
    tierId: SandboxTierId;
    violationType?: "resource" | "isolation" | "determinism" | "unknown";
    driftScore?: number;
}
/**
 * Escalate sandbox tier based on violation type.
 * Uses sandboxFallbackChain from sandbox.config.json.
 */
export declare function handleSandboxViolation(run: SandboxRunResult): Promise<SandboxTierId>;
//# sourceMappingURL=sandbox-violation.d.ts.map