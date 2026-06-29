// src/cic-runtime/sandbox-exec/s0-exec.ts

import { exec } from "child_process";
import util from "util";
import { ExecutionResult, InputSnapshot, EnvironmentSnapshot } from "../runtime-types";

const execAsync = util.promisify(exec);

/**
 * S0: Ephemeral container execution.
 * Minimal isolation, fastest path.
 */
export async function executeS0(
  env: EnvironmentSnapshot,
  input: InputSnapshot
): Promise<ExecutionResult> {
  const start = Date.now();

  const dockerCmd = `
    docker run --rm \
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
  } catch (err: any) {
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
        type: "resource",
        details: err.message
      }
    };
  }
}

function escapeForShell(code: string): string {
  return code.replace(/'/g, "'\"'\"'");
}
