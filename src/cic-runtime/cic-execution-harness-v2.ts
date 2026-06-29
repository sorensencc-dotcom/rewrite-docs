// src/cic-runtime/cic-execution-harness-v2.ts

import { MAALRouteRequest, MAALRouteResponse } from "../maal/router/maal-router-types";
import { routeWithSandboxAndStability } from "../maal/router/route-with-sandbox-and-stability";

import { EnvironmentSnapshot, InputSnapshot, ExecutionResult, TelemetrySnapshot } from "./runtime-types";
import { provisionSandboxEnvironment } from "./cic-execution-harness"; // Pulled from the v1 harness stub
import { executeInSandboxTier } from "./sandbox-exec/sandbox-exec-router";

import { handleSandboxViolation } from "../maal/router/sandbox-violation";
import { computeDriftScore } from "./drift/compute-drift-score";

import { generateRunManifest } from "./generate-run-manifest";
import { ingestRunManifest } from "./audit-log/ingest-run-manifest";

/**
 * Build telemetry snapshot with real drift scoring.
 */
async function buildTelemetrySnapshot(
  req: MAALRouteRequest,
  route: MAALRouteResponse,
  exec: ExecutionResult,
  modelOutput: string,
  deterministicSeed?: number
): Promise<TelemetrySnapshot> {

  const driftScore = await computeDriftScore(
    modelOutput,
    exec.stdout,
    deterministicSeed
  );

  return {
    sloCompliance: {
      latency: true,
      isolation: exec.violation ? false : true,
      reliability: exec.exitCode === 0
    },
    modelOutput,
    driftScore
  };
}

/**
 * Hardened CIC execution harness (Sandbox‑2).
 */
export async function runCICExecutionHarnessV2(
  req: MAALRouteRequest,
  input: InputSnapshot,
  modelOutput: string
) {
  // 1. Route via MAAL (model + sandbox + stability)
  let route: MAALRouteResponse = routeWithSandboxAndStability(req);

  // 2. Provision sandbox environment
  let env: EnvironmentSnapshot = await provisionSandboxEnvironment(
    route.selectedSandboxTier,
    route.selectedModel
  );

  // 3. Execute code inside sandbox
  let execResult: ExecutionResult = await executeInSandboxTier(
    route.selectedSandboxTier,
    env,
    input
  );

  // 4. Handle sandbox violations → escalate tier
  if (execResult.violation) {
    const newTier = handleSandboxViolation({
      tierId: route.selectedSandboxTier,
      violationType: execResult.violation.type
    });

    if (newTier !== route.selectedSandboxTier) {
      env = await provisionSandboxEnvironment(newTier, route.selectedModel);
      execResult = await executeInSandboxTier(newTier, env, input);

      route.selectedSandboxTier = newTier;
      route.reasonCodes.push(`sandboxEscalated:${newTier}`);
    }
  }

  // 5. Build telemetry (real drift scoring)
  const deterministicSeed =
    route.selectedSandboxTier === "S3" ? env.seed : undefined;

  const telemetry = await buildTelemetrySnapshot(
    req,
    route,
    execResult,
    modelOutput,
    deterministicSeed
  );

  // 6. Generate manifest
  const manifest = generateRunManifest(
    req,
    route,
    env,
    input,
    execResult,
    telemetry
  );

  // 7. Ingest audit log (PostgreSQL authoritative)
  await ingestRunManifest(manifest);

  // 8. Return manifest
  return manifest;
}
