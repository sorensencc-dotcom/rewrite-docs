// src/cic-runtime/cic-execution-harness.ts

import { exec } from "child_process";
import util from "util";

import { MAALRouteRequest, MAALRouteResponse } from "../maal/router/maal-router-types";
import { routeWithSandboxAndStability } from "../maal/router/route-with-sandbox-and-stability";
import { handleSandboxViolation } from "../maal/router/sandbox-violation";

import { EnvironmentSnapshot, InputSnapshot, ExecutionResult, TelemetrySnapshot } from "./runtime-types";
import { generateRunManifest } from "./generate-run-manifest";
import { ingestRunManifest } from "./audit-log";

const execAsync = util.promisify(exec);

/**
 * Provision a sandbox environment for S0/S1.
 * S2/S3 are stubbed for Phase Sandbox‑1.
 */
export async function provisionSandboxEnvironment(
  tier: "S0" | "S1" | "S2" | "S3",
  modelId: string
): Promise<EnvironmentSnapshot> {

  // In Phase Sandbox‑1, we simulate environment metadata.
  const osImageHash = "sha256:local-dev-image";
  const runtimeVersions = { node: process.version };
  const libraryHashes = {};
  const seed = Math.floor(Math.random() * 1_000_000);

  // Map tier → isolation/determinism/network/cost
  const tierMap = {
    S0: {
      isolationLevel: "container",
      determinism: "low",
      network: "off",
      costTier: "lowest"
    },
    S1: {
      isolationLevel: "hardened_container",
      determinism: "medium",
      network: "allowlist",
      costTier: "low"
    },
    S2: {
      isolationLevel: "microvm",
      determinism: "medium_high",
      network: "strict",
      costTier: "medium"
    },
    S3: {
      isolationLevel: "microvm_offline",
      determinism: "high",
      network: "none",
      costTier: "highest"
    }
  };

  return {
    osImageHash,
    runtimeVersions,
    libraryHashes,
    seed,
    modelVersion: "v1",
    sandboxIsolationLevel: tierMap[tier].isolationLevel,
    sandboxDeterminism: tierMap[tier].determinism,
    sandboxNetwork: tierMap[tier].network,
    sandboxCostTier: tierMap[tier].costTier
  };
}

/**
 * Execute code inside a sandbox.
 * S0/S1 use `docker run` via child_process.
 * S2/S3 are stubbed for Phase Sandbox‑1.
 */
export async function executeInSandbox(
  env: EnvironmentSnapshot,
  input: InputSnapshot
): Promise<ExecutionResult> {

  const start = Date.now();

  try {
    // Phase Sandbox‑1: S0/S1 use docker run
    const dockerCmd = `
      docker run --rm \
      node:20 \
      sh -c "node -e '${escapeForShell(input.code)}'"
    `;

    const { stdout, stderr } = await execAsync(dockerCmd);

    const end = Date.now();

    return {
      stdout,
      stderr,
      exitCode: 0,
      resourceUsage: {
        cpuMs: 0,          // Phase Sandbox‑1: stub
        memoryMb: 0,       // Phase Sandbox‑1: stub
        wallTimeMs: end - start
      },
      networkCalls: [],    // Phase Sandbox‑1: stub
      violation: undefined
    };

  } catch (err: any) {
    const end = Date.now();

    return {
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? err.message,
      exitCode: err.code ?? 1,
      resourceUsage: {
        cpuMs: 0,
        memoryMb: 0,
        wallTimeMs: end - start
      },
      networkCalls: [],
      violation: {
        type: "resource",
        details: err.message
      }
    };
  }
}

/**
 * Escape code for safe shell embedding.
 */
function escapeForShell(code: string): string {
  return code.replace(/'/g, "'\"'\"'");
}

/**
 * Build telemetry snapshot.
 * Phase Sandbox‑1: minimal implementation.
 */
function buildTelemetrySnapshot(
  req: MAALRouteRequest,
  route: MAALRouteResponse,
  exec: ExecutionResult
): TelemetrySnapshot {

  return {
    sloCompliance: {
      latency: true,
      isolation: true,
      reliability: exec.exitCode === 0
    },
    modelOutput: "",     // Phase Sandbox‑1: stub
    driftScore: 0        // computed in generateRunManifest
  };
}

/**
 * Main CIC execution harness.
 * This is the orchestrator for Phase Sandbox‑1.
 */
export async function runCICExecutionHarness(
  req: MAALRouteRequest,
  input: InputSnapshot
) {
  // 1. Route via MAAL (model + sandbox + stability)
  let route: MAALRouteResponse = routeWithSandboxAndStability(req);

  // 2. Provision sandbox environment
  let env = await provisionSandboxEnvironment(
    route.selectedSandboxTier,
    route.selectedModel
  );

  // 3. Execute code inside sandbox
  let execResult = await executeInSandbox(env, input);

  // 4. Handle sandbox violations
  if (execResult.violation) {
    const newTier = handleSandboxViolation({
      tierId: route.selectedSandboxTier,
      violationType: execResult.violation.type
    });

    if (newTier !== route.selectedSandboxTier) {
      env = await provisionSandboxEnvironment(newTier, route.selectedModel);
      execResult = await executeInSandbox(env, input);

      route.selectedSandboxTier = newTier;
      route.reasonCodes.push(`sandboxEscalated:${newTier}`);
    }
  }

  // 5. Build telemetry
  const telemetry = buildTelemetrySnapshot(req, route, execResult);

  // 6. Generate manifest
  const manifest = generateRunManifest(
    req,
    route,
    env,
    input,
    execResult,
    telemetry
  );

  // 7. Ingest audit log
  await ingestRunManifest(manifest);

  // 8. Return manifest
  return manifest;
}
