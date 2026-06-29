import fs from "node:fs";
import path from "node:path";
import { ModelSpec } from "./modelSpec.js";
import { ConfigurationError } from "./errors.js";

const modelsBasePath = process.env.NODE_ENV === "test"
  ? path.join(process.cwd(), "src")
  : path.join(process.cwd(), "src");

const MODELS_DIR = path.join(modelsBasePath, "models");

let registry: Map<string, ModelSpec> | null = null;

export function loadModelRegistry(): Map<string, ModelSpec> {
  if (registry) return registry;

  registry = new Map();

  const files = fs.readdirSync(MODELS_DIR).filter((f: string) => f.endsWith(".json"));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(MODELS_DIR, file), "utf8");
    const spec = JSON.parse(raw) as ModelSpec;
    validateModelSpec(spec);

    if (spec.routingBias == null) {
      spec.routingBias =
        spec.provider === "mock" || spec.provider === "ollama" || spec.provider === "local"
          ? 100
          : 10;
    }

    registry.set(spec.name, spec);
  }

  return registry;
}

export function getModelSpec(name: string): ModelSpec {
  const reg = loadModelRegistry();
  const spec = reg.get(name);
  if (!spec) {
    throw new ConfigurationError(`Unknown model: ${name}`);
  }
  return spec;
}

function validateModelSpec(spec: ModelSpec): void {
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
    throw new ConfigurationError(
      `Invalid capabilities in model spec: ${spec.name}`
    );
  }
}
