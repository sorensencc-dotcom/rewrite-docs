// src/maal/router/maal-router-types.ts

import { SandboxTierId } from "../../cic/types/run-manifest.js";
import { UnifiedChatRequest, UnifiedChatResponse } from "../../types/unifiedChatTypes.js";

export { UnifiedChatRequest, UnifiedChatResponse };

/**
 * Request for MAAL routing decision.
 * Includes execution context, trust profile, and SLO requirements.
 */
export interface MAALRouteRequest {
  userId?: string;
  trustLevel: "public" | "external" | "internal" | "admin";
  dataSensitivity: "public" | "low" | "medium" | "high" | "pii";
  taskType: "code_run" | "inference" | "classification" | "embedding" | "planning";
  sloProfile: {
    latency: "low" | "medium" | "high";
    isolation: "low" | "medium" | "high";
  };
  costBudget?: number; // USD budget for this run
  context?: Record<string, unknown>;
}

/**
 * Response from MAAL router.
 * Encodes model and sandbox tier selection with reasoning.
 */
export interface MAALRouteResponse {
  selectedModel: string;
  selectedSandboxTier: SandboxTierId;
  reasonCodes: string[]; // e.g., ["model:claude-opus", "sandbox:S1", "slo:isolation"]
  driftScore?: number;
  stabilityScore?: number;
  costEstimate?: number; // estimated USD cost
}
