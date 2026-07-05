import { RunManifest } from "../cic/types/run-manifest";
import { MAALRouteRequest, MAALRouteResponse } from "../maal/router/maal-router-types";
import { EnvironmentSnapshot, InputSnapshot, ExecutionResult, TelemetrySnapshot } from "./runtime-types";
/**
 * Generate the immutable RunManifest AFTER sandbox execution.
 * This function must never mutate its inputs.
 */
export declare function generateRunManifest(req: MAALRouteRequest, route: MAALRouteResponse, env: EnvironmentSnapshot, input: InputSnapshot, exec: ExecutionResult, telemetry: TelemetrySnapshot): RunManifest;
//# sourceMappingURL=generate-run-manifest.d.ts.map