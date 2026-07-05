import { getModelSpec } from "./modelRegistry.js";
export function supportsToolCalls(model) {
    return getModelSpec(model).supports.toolCalls;
}
export function supportsVision(model) {
    return getModelSpec(model).supports.vision;
}
export function supportsStreaming(model) {
    return getModelSpec(model).supports.streaming;
}
export function supportsEmbeddings(model) {
    return getModelSpec(model).supports.embeddings;
}
//# sourceMappingURL=capabilities.js.map