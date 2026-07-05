import { ModelRouter } from "../../core/modelRouter.js";
import { loadModelRegistry } from "../../core/modelRegistry.js";
import { AgentRoutingProfile } from "../../agents/routingProfile.js";
describe("C-2: Capability Filtering Determinism", () => {
    let router;
    beforeEach(() => {
        process.env.MAAL_MODE = "hybrid";
        router = new ModelRouter(loadModelRegistry());
    });
    afterEach(() => {
        delete process.env.MAAL_MODE;
    });
    describe("toolCalls capability", () => {
        it("vision required → always same model", () => {
            const profile = new AgentRoutingProfile(["mock", "claude-3.7", "fugu"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }],
                requires: { toolCalls: true }
            };
            const results = Array.from({ length: 50 }, () => router.selectModel(profile, payload));
            const expected = results[0];
            results.forEach(result => {
                expect(result.name).toBe(expected.name);
                expect(result.supports.toolCalls).toBe(true);
            });
        });
        it("blocks toolCalls-incapable models consistently", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true }
            };
            const results = Array.from({ length: 50 }, () => router.selectModel(profile, payload));
            const expected = results[0];
            results.forEach(result => {
                expect(result.name).toBe(expected.name);
                expect(result.supports.toolCalls).toBe(true);
            });
        });
    });
    describe("vision capability", () => {
        it("vision required → always picks vision-capable", () => {
            const profile = new AgentRoutingProfile(["mock", "claude-3.7", "gpt-4.1"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }],
                requires: { vision: true }
            };
            const selections = Array.from({ length: 50 }, () => router.selectModel(profile, payload));
            const expected = selections[0];
            selections.forEach(sel => {
                expect(sel.name).toBe(expected.name);
                expect(sel.supports.vision).toBe(true);
            });
        });
        it("vision filter stable across 100 runs", () => {
            const profile = new AgentRoutingProfile(["gpt-4.1", "claude-3.7"]);
            const payload = {
                model: "",
                messages: [],
                requires: { vision: true }
            };
            const runs = Array.from({ length: 100 }, () => router.selectModel(profile, payload));
            const model = runs[0].name;
            runs.forEach(run => {
                expect(run.name).toBe(model);
                expect(run.supports.vision).toBe(true);
            });
        });
    });
    describe("combined capability requirements", () => {
        it("toolCalls + vision → deterministic selection", () => {
            const profile = new AgentRoutingProfile(["claude-3.7", "gpt-4.1", "fugu"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true, vision: true }
            };
            const results = Array.from({ length: 50 }, () => router.selectModel(profile, payload));
            const first = results[0];
            results.forEach(result => {
                expect(result.name).toBe(first.name);
                expect(result.supports.toolCalls).toBe(true);
                expect(result.supports.vision).toBe(true);
            });
        });
        it("rejects[] array stable in ordering", () => {
            const profile = new AgentRoutingProfile(["mock", "claude-3.7"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true }
            };
            const model = router.selectModel(profile, payload);
            expect(model.supports.toolCalls).toBe(true);
        });
    });
    describe("maxTokens filtering", () => {
        it("large context (4096) → same model consistently", () => {
            const profile = new AgentRoutingProfile(["claude-3.7", "gpt-4.1"]);
            const payload = {
                model: "",
                messages: [],
                maxTokens: 4096
            };
            const selections = Array.from({ length: 30 }, () => router.selectModel(profile, payload));
            const expected = selections[0];
            selections.forEach(sel => {
                expect(sel.name).toBe(expected.name);
            });
        });
        it("ultra-large context (32k) deterministic", () => {
            const profile = new AgentRoutingProfile(["gpt-4.1", "claude-3.7"]);
            const payload = {
                model: "",
                messages: [],
                maxTokens: 32000
            };
            const runs = Array.from({ length: 20 }, () => router.selectModel(profile, payload));
            const model = runs[0].name;
            runs.forEach(run => {
                expect(run.name).toBe(model);
            });
        });
    });
    describe("no requirements fallback", () => {
        it("when no requirements, routing is still deterministic", () => {
            const profile = new AgentRoutingProfile(["mock", "claude-3.7"]);
            const payload = {
                model: "",
                messages: []
            };
            const results = Array.from({ length: 100 }, () => router.selectModel(profile, payload));
            const first = results[0];
            results.forEach(result => {
                expect(result.name).toBe(first.name);
            });
        });
    });
    describe("capability gates consistency", () => {
        it("capabilityGates ordering stable", () => {
            const profile = new AgentRoutingProfile(["gpt-4.1", "claude-3.7"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true, vision: true }
            };
            const models = Array.from({ length: 20 }, () => router.selectModel(profile, payload));
            const gates = models[0].supports;
            models.forEach(m => {
                expect(m.supports.toolCalls).toBe(gates.toolCalls);
                expect(m.supports.vision).toBe(gates.vision);
            });
        });
    });
});
//# sourceMappingURL=c02-capability-filtering-determinism.test.js.map