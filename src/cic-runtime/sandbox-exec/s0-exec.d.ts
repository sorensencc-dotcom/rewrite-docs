import { ExecutionResult, InputSnapshot, EnvironmentSnapshot } from "../runtime-types";
/**
 * S0: Ephemeral container execution.
 * Minimal isolation, fastest path.
 */
export declare function executeS0(env: EnvironmentSnapshot, input: InputSnapshot): Promise<ExecutionResult>;
//# sourceMappingURL=s0-exec.d.ts.map