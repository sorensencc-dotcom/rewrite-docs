// src/cic-runtime/sandbox-exec/sandbox-exec-router.ts
import { executeS0 } from "./s0-exec";
import { executeS1 } from "./s1-exec";
import { executeS2 } from "./s2-exec-gvisor";
import { executeS3 } from "./s3-exec-firecracker";
/**
 * Unified sandbox execution router.
 * Selects the correct executor based on sandbox tier.
 */
export async function executeInSandboxTier(tier, env, input) {
    switch (tier) {
        case "S0":
            return executeS0(env, input);
        case "S1":
            return executeS1(env, input);
        case "S2":
            return executeS2(env, input);
        case "S3":
            return executeS3(env, input);
        default:
            throw new Error(`Unknown sandbox tier: ${tier}`);
    }
}
//# sourceMappingURL=sandbox-exec-router.js.map