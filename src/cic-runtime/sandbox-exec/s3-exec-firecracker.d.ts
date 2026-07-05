import { ExecutionResult, InputSnapshot, EnvironmentSnapshot } from "../runtime-types";
/**
 * Firecracker stub for Sandbox‑2.
 * Provides deterministic VM boot + vsock execution.
 * Real isolation, no network, pinned rootfs.
 */
export declare function executeS3(env: EnvironmentSnapshot, input: InputSnapshot): Promise<ExecutionResult>;
//# sourceMappingURL=s3-exec-firecracker.d.ts.map