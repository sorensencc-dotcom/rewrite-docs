// src/tests/cic-runtime/sandbox-exec.test.ts

import { executeInSandboxTier } from "../../cic-runtime/sandbox-exec/sandbox-exec-router";

jest.mock("child_process", () => ({
  exec: (cmd: string, cb: any) => cb(null, { stdout: "ok", stderr: "" })
}));

describe("Sandbox Exec Router", () => {
  const env: any = {
    osImageHash: "sha256:abc",
    runtimeVersions: { node: "20" },
    libraryHashes: {},
    seed: 42,
    modelVersion: "v1",
    sandboxIsolationLevel: "container",
    sandboxDeterminism: "low",
    sandboxNetwork: "none",
    sandboxCostTier: "low"
  };

  const input: any = { code: "console.log('hi')", config: {} };

  test("S0 executes successfully", async () => {
    const res = await executeInSandboxTier("S0", env, input);
    expect(res.stdout).toBe("ok");
  });

  test("S1 executes successfully", async () => {
    const res = await executeInSandboxTier("S1", env, input);
    expect(res.stdout).toBe("ok");
  });

  test("S2 executes successfully (gVisor mocked)", async () => {
    const res = await executeInSandboxTier("S2", env, input);
    expect(res.stdout).toBe("ok");
  });

  test("S3 executes successfully (Firecracker stub)", async () => {
    const res = await executeInSandboxTier("S3", env, input);
    expect(res.stdout).toBe("ok");
  });
});
