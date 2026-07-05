// src/cic-runtime/sandbox-exec/s2-exec-gvisor.ts
import { exec } from "child_process";
import util from "util";
import { executeS1 } from "./s1-exec";
const execAsync = util.promisify(exec);
/**
 * Check if gVisor (runsc) is installed.
 */
async function hasRunsc() {
    try {
        await execAsync("which runsc");
        return true;
    }
    catch {
        return false;
    }
}
/**
 * S2: gVisor execution via runsc.
 * Hardened isolation with user-space kernel.
 */
export async function executeS2(env, input) {
    const start = Date.now();
    if (!(await hasRunsc())) {
        // Fallback to S1
        return executeS1(env, input);
    }
    const dockerCmd = `
    docker run --rm \
    --runtime=runsc \
    node:20 \
    sh -c "node -e '${escapeForShell(input.code)}'"
  `;
    try {
        const { stdout, stderr } = await execAsync(dockerCmd);
        return {
            stdout,
            stderr,
            exitCode: 0,
            resourceUsage: {
                cpuMs: 0,
                memoryMb: 0,
                wallTimeMs: Date.now() - start
            },
            networkCalls: [],
            violation: undefined
        };
    }
    catch (err) {
        return {
            stdout: err.stdout ?? "",
            stderr: err.stderr ?? err.message,
            exitCode: err.code ?? 1,
            resourceUsage: {
                cpuMs: 0,
                memoryMb: 0,
                wallTimeMs: Date.now() - start
            },
            networkCalls: [],
            violation: {
                type: "isolation",
                details: err.message
            }
        };
    }
}
function escapeForShell(code) {
    return code.replace(/'/g, "'\"'\"'");
}
//# sourceMappingURL=s2-exec-gvisor.js.map