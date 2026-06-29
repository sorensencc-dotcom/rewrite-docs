import { getModelSpec } from "./modelRegistry.js";

export function supportsToolCalls(model: string): boolean {
  return getModelSpec(model).supports.toolCalls;
}

export function supportsVision(model: string): boolean {
  return getModelSpec(model).supports.vision;
}

export function supportsStreaming(model: string): boolean {
  return getModelSpec(model).supports.streaming;
}

export function supportsEmbeddings(model: string): boolean {
  return getModelSpec(model).supports.embeddings;
}
