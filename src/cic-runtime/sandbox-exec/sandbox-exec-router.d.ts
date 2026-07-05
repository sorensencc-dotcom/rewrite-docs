import { EnvironmentSnapshot, InputSnapshot, ExecutionResult } from "../runtime-types";
/**
 * Unified sandbox execution router.
 * Selects the correct executor based on sandbox tier.
 */
export declare function executeInSandboxTier(tier: "S0" | "S1" | "S2" | "S3", env: EnvironmentSnapshot, input: InputSnapshot): Promise<ExecutionResult>;
//# sourceMappingURL=sandbox-exec-router.d.ts.map