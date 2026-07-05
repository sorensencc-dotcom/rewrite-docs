import fs from "node:fs";
import path from "node:path";
import { ConfigurationError } from "./errors.js";
import { CLOUD_MODEL_SPECS } from "./cloudModelSpecs.js";
const modelsBasePath = process.env.NODE_ENV === "test"
    ? path.join(process.cwd(), "src")
    : path.join(process.cwd(), "src");
const MODELS_DIR = path.join(modelsBasePath, "models");
let registry = null;
export function loadModelRegistry() {
    if (registry)
        return registry;
    registry = new Map();
    const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
        const raw = fs.readFileSync(path.join(MODELS_DIR, file), "utf8");
        const spec = JSON.parse(raw);
        validateModelSpec(spec);
        if (spec.routingBias == null) {
            spec.routingBias =
                spec.provider === "mock" || spec.provider === "ollama" || spec.provider === "local"
                    ? 100
                    : 10;
        }
        registry.set(spec.name, spec);
    }
    // Add cloud model specs
    for (const [id, cloudSpec] of Object.entries(CLOUD_MODEL_SPECS)) {
        if (cloudSpec.supported) {
            const modelSpec = convertCloudSpecToModelSpec(cloudSpec);
            registry.set(id, modelSpec);
        }
    }
    return registry;
}
function convertCloudSpecToModelSpec(cloudSpec) {
    return {
        name: cloudSpec.id,
        provider: cloudSpec.provider,
        type: "cloud-openai-compatible",
        apiBase: `https://api.${cloudSpec.provider}.com/v1`,
        env: cloudSpec.auth.envVar,
        maxTokens: 4096,
        supports: {
            chat: true,
            toolCalls: true,
            streaming: false,
            vision: false,
            embeddings: false,
        },
        routingBias: 50,
    };
}
export function getModelSpec(name) {
    const reg = loadModelRegistry();
    const spec = reg.get(name);
    if (!spec) {
        throw new ConfigurationError(`Unknown model: ${name}`);
    }
    return spec;
}
function validateModelSpec(spec) {
    if (!spec.name || !spec.provider || !spec.type || !spec.apiBase) {
        throw new ConfigurationError(`Invalid model spec: ${spec?.name || "unknown"}`);
    }
    if (spec.provider !== "mock" && !spec.env) {
        throw new ConfigurationError(`Missing env for non-mock model: ${spec.name}`);
    }
    if (!spec.supports || typeof spec.supports !== "object") {
        throw new ConfigurationError(`Invalid supports object in model spec: ${spec.name}`);
    }
    if (typeof spec.supports.chat !== "boolean" || typeof spec.supports.toolCalls !== "boolean") {
        throw new ConfigurationError(`Invalid capabilities in model spec: ${spec.name}`);
    }
}
//# sourceMappingURL=modelRegistry.js.map