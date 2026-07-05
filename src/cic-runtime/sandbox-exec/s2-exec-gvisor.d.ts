import { ExecutionResult, InputSnapshot, EnvironmentSnapshot } from "../runtime-types";
/**
 * S2: gVisor execution via runsc.
 * Hardened isolation with user-space kernel.
 */
export declare function executeS2(env: EnvironmentSnapshot, input: InputSnapshot): Promise<ExecutionResult>;
//# sourceMappingURL=s2-exec-gvisor.d.ts.map