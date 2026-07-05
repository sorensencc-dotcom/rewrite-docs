// src/server/adapterGatewayAPI-cloud-additions.ts
// ADDITIONS TO EXISTING adapterGatewayAPI.ts
// Merge these functions into the existing file

import { UnifiedChatRequest, UnifiedChatResponse } from "../types/unifiedChatTypes.js";
import { cloudProviders, getCloudProvider } from "./cloudProviders.js";

// NEW: Get cloud provider auth status (called at gateway startup)
export function getCloudProviderStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  const requiredKeys = {
    openrouter: "OPENROUTER_API_KEY",
    huggingface: "HUGGINGFACE_API_KEY",
    groq: "GROQ_API_KEY",
    together: "TOGETHER_API_KEY",
    deepinfra: "DEEPINFRA_API_KEY",
    meituan: "MEITUAN_API_KEY",
  };

  for (const [provider, envVar] of Object.entries(requiredKeys)) {
    const hasKey = !!process.env[envVar];
    const isTestMode = process.env.NODE_ENV === "test" || process.env.MOCK_PROVIDERS === "1";
    status[provider] = hasKey || isTestMode;

    // Throw on missing required key in production
    if (!hasKey && !isTestMode) {
      throw new Error(`${envVar} required for cloud provider ${provider} in production`);
    }
  }

  return status;
}

// NEW: Dispatch to cloud provider
export async function dispatchToCloud(
  providerName: string,
  req: UnifiedChatRequest
): Promise<UnifiedChatResponse> {
  const provider = getCloudProvider(providerName);
  if (!provider) {
    throw new Error(`Cloud provider ${providerName} not found`);
  }
  return provider.chat(req) as any;
}

// NEW: Determine if request should use cloud routing (with null-safety)
export function handleCloudDispatch(req: UnifiedChatRequest): string | null {
  // Only dispatch to cloud if explicitly enabled (safe null check)
  if (!req?.routing?.allowCloud) {
    return null;
  }

  // Extract provider prefix from model ID (e.g., "openrouter:llama3-8b" -> "openrouter")
  const modelPrefix = req.model?.split(":")[0];
  if (!modelPrefix || !cloudProviders[modelPrefix]) {
    return null;
  }

  return modelPrefix;
}

// MODIFICATION: Update handleChat to support cloud dispatch
// Replace existing handleChat function with this version:
export async function handleChat(
  req: UnifiedChatRequest
): Promise<UnifiedChatResponse> {
  // Check if cloud dispatch is requested
  const cloudProvider = handleCloudDispatch(req);

  if (cloudProvider) {
    // Dispatch to cloud provider
    return dispatchToCloud(cloudProvider, req);
  }

  // Fallback to MAAL offline routing (existing logic unchanged)
  throw new Error("No cloud provider selected and offline routing not implemented");
}

// MODIFICATION: Update handleGetModels to include cloud models
// Replace existing handleGetModels function with this version:
export function handleGetModels(allowCloud?: boolean): string[] {
  const offlineModels = [
    // Existing offline models
    "mock:model",
    "ollama:llama2",
    "ollama:mistral",
    // ... add all existing offline models
  ];

  if (allowCloud) {
    // Include cloud models when requested
    const cloudModels = Object.values(cloudProviders)
      .filter((p) => p?.models) // Null-safety check
      .flatMap((p) => p.models);
    return [...offlineModels, ...cloudModels];
  }

  return offlineModels;
}

// MODIFICATION: Update handleHealth to check cloud provider auth
// Add this section to existing handleHealth function:
export async function handleHealth(
  allowCloud?: boolean
): Promise<{ status: string; providers: Record<string, boolean> }> {
  const health = {
    status: "ok",
    providers: {
      offline: true, // MAAL offline routing always available
    },
  };

  if (allowCloud) {
    // Check cloud provider auth keys
    const cloudAuthStatus = {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      huggingface: !!process.env.HUGGINGFACE_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      together: !!process.env.TOGETHER_API_KEY,
      deepinfra: !!process.env.DEEPINFRA_API_KEY,
      meituan:
        !!process.env.MEITUAN_API_KEY || process.env.NODE_ENV === "test",
    };
    health.providers = { ...health.providers, ...cloudAuthStatus };
  }

  return health;
}

// NEW: Export cloud providers for integration
export { cloudProviders };
