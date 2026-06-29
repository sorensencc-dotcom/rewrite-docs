// src/cic-runtime/sandbox-exec/s1-exec.ts

import { exec } from "child_process";
import util from "util";
import { ExecutionResult, InputSnapshot, EnvironmentSnapshot } from "../runtime-types";
import { buildAllowlistFlags } from "../network/network-allowlist";

const execAsync = util.promisify(exec);

/**
 * S1: Hardened container execution.
 * Real isolation enforcement.
 */
export async function executeS1(
  env: EnvironmentSnapshot,
  input: InputSnapshot
): Promise<ExecutionResult> {
  const start = Date.now();

  const allowlistFlags = buildAllowlistFlags(env.sandboxNetwork);

  const dockerCmd = `
    docker run --rm \
    --cap-drop=ALL \
    --security-opt=no-new-privileges \
    --pids-limit=256 \
    --memory=512m \
    --read-only \
    --tmpfs /tmp \
    ${allowlistFlags} \
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
      networkCalls: [], // allowlist logs added in Sandbox‑3
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
        type: "isolation",
        details: err.message
      }
    };
  }
}

function escapeForShell(code: string): string {
  return code.replace(/'/g, "'\"'\"'");
}
