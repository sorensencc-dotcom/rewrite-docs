import { SandboxTierId } from "../../cic/types/run-manifest";
import { MAALRouteRequest, MAALRouteResponse } from "./maal-router-types";
/**
 * Select sandbox tier based on:
 * - trustLevel
 * - dataSensitivity
 * - taskType
 * - SLO isolation requirement
 * - cost preference
 */
export declare function selectSandboxTier(req: MAALRouteRequest): {
    id: SandboxTierId;
    reasonCodes: string[];
};
/**
 * Main MAAL router wrapper:
 * - Select model (existing LLMRouter)
 * - Select sandbox tier (new)
 */
export declare function routeWithSandbox(req: MAALRouteRequest): MAALRouteResponse;
//# sourceMappingURL=route-with-sandbox.d.ts.map