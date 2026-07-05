import { ModelRouter } from "../../core/modelRouter.js";
import { loadModelRegistry } from "../../core/modelRegistry.js";
import { AgentRoutingProfile } from "../../agents/routingProfile.js";
import * as crypto from "crypto";
describe("C-5: JSON Ordering Determinism", () => {
    let router;
    beforeEach(() => {
        process.env.MAAL_MODE = "local";
        router = new ModelRouter(loadModelRegistry());
    });
    afterEach(() => {
        delete process.env.MAAL_MODE;
    });
    const hashJSON = (obj) => {
        const json = JSON.stringify(obj, Object.keys(obj).sort());
        return crypto.createHash("sha256").update(json).digest("hex");
    };
    describe("router output canonicalization", () => {
        it("100 runs produce byte-identical JSON output", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "canonical test" }]
            };
            const outputs = Array.from({ length: 100 }, () => {
                const model = router.selectModel(profile, payload);
                return JSON.stringify({
                    name: model.name,
                    provider: model.provider,
                    routingBias: model.routingBias,
                    supports: model.supports
                });
            });
            const first = outputs[0];
            outputs.forEach(output => {
                expect(output).toBe(first);
            });
        });
        it("stable key ordering in output", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const models = Array.from({ length: 20 }, () => router.selectModel(profile, payload));
            const first = models[0];
            const keys = Object.keys(first).sort();
            models.forEach(model => {
                const modelKeys = Object.keys(model).sort();
                expect(modelKeys).toEqual(keys);
            });
        });
    });
    describe("stable array ordering", () => {
        it("fallback chain array stable", () => {
            const profile = new AgentRoutingProfile(["mock"], ["claude-3.7", "fugu", "gpt-4.1"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true }
            };
            const selections = Array.from({ length: 30 }, () => router.selectModel(profile, payload));
            const firstModel = selections[0];
            selections.forEach(sel => {
                expect(sel.name).toBe(firstModel.name);
                expect(sel.provider).toBe(firstModel.provider);
            });
        });
    });
    describe("nested object ordering", () => {
        it("supports object keys stable", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const models = Array.from({ length: 20 }, () => router.selectModel(profile, payload));
            const firstSupports = Object.keys(models[0].supports).sort();
            models.forEach(model => {
                const supportsKeys = Object.keys(model.supports).sort();
                expect(supportsKeys).toEqual(firstSupports);
            });
        });
        it("supports values stable", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const supports = Array.from({ length: 50 }, () => {
                const model = router.selectModel(profile, payload);
                return JSON.stringify(model.supports);
            });
            const first = supports[0];
            supports.forEach(sup => {
                expect(sup).toBe(first);
            });
        });
    });
    describe("deterministic serialization", () => {
        it("JSON.stringify output identical across runs", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const serialized = Array.from({ length: 100 }, () => {
                const model = router.selectModel(profile, payload);
                return JSON.stringify({
                    name: model.name,
                    provider: model.provider,
                    type: model.type,
                    routingBias: model.routingBias,
                    supports: {
                        toolCalls: model.supports.toolCalls,
                        vision: model.supports.vision,
                        streaming: model.supports.streaming,
                        embeddings: model.supports.embeddings
                    }
                });
            });
            const first = serialized[0];
            serialized.forEach(s => {
                expect(s).toBe(first);
            });
        });
        it("hash of JSON output stable", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const hashes = Array.from({ length: 100 }, () => {
                const model = router.selectModel(profile, payload);
                const json = {
                    name: model.name,
                    provider: model.provider,
                    routing: model.routingBias
                };
                return hashJSON(json);
            });
            const first = hashes[0];
            hashes.forEach(hash => {
                expect(hash).toBe(first);
            });
        });
    });
    describe("canonical ordering under requirements", () => {
        it("with capability requirements JSON stable", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true, vision: true }
            };
            const jsons = Array.from({ length: 30 }, () => {
                const model = router.selectModel(profile, payload);
                return JSON.stringify({
                    name: model.name,
                    provider: model.provider,
                    supports: model.supports
                });
            });
            const first = jsons[0];
            jsons.forEach(j => {
                expect(j).toBe(first);
            });
        });
    });
    describe("no nondeterministic fields", () => {
        it("UUID/random fields absent from routing decision", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const model = router.selectModel(profile, payload);
            const json = JSON.stringify(model);
            // Check for common nondeterministic patterns (word boundaries for id to avoid false positives like apiBase)
            expect(json).not.toMatch(/"(uuid|id|timestamp|random|nonce|requestId|correlationId)":/i);
        });
        it("no timestamp fields in output", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const model = router.selectModel(profile, payload);
            expect(model).not.toHaveProperty("createdAt");
            expect(model).not.toHaveProperty("timestamp");
            expect(model).not.toHaveProperty("updatedAt");
            expect(model).not.toHaveProperty("expiresAt");
        });
    });
    describe("multirun serialization", () => {
        it("1000 runs → all serializations identical", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const serializations = new Set(Array.from({ length: 1000 }, () => {
                const model = router.selectModel(profile, payload);
                return JSON.stringify({
                    name: model.name,
                    provider: model.provider,
                    routing: model.routingBias
                });
            }));
            expect(serializations.size).toBe(1);
        });
    });
});
//# sourceMappingURL=c05-json-ordering-determinism.test.js.map