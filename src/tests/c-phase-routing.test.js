import { ModelRouter } from "../core/modelRouter.js";
import { loadModelRegistry, getModelSpec } from "../core/modelRegistry.js";
import { AgentRoutingProfile } from "../agents/routingProfile.js";
import { OrchestratorAgent } from "../agents/orchestratorAgent.js";
import { EnrichmentAgent } from "../agents/enrichmentAgent.js";
import { SynthesisAgent } from "../agents/synthesisAgent.js";
import { AuditAgent } from "../agents/auditAgent.js";
describe("C-Phase: Direct Agent Invocation & Routing Verification Suite", () => {
    let router;
    beforeEach(() => {
        process.env.MAAL_MODE = "local";
        router = new ModelRouter(loadModelRegistry());
    });
    afterEach(() => {
        delete process.env.MAAL_MODE;
    });
    describe("Routing Tests: ModelRouter.selectModel()", () => {
        it("routes to mock in local mode", () => {
            const profile = new AgentRoutingProfile(["claude-3.7", "fugu"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }]
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.name).toBe("mock");
            expect(selected.provider).toBe("mock");
        });
        it("respects mock's high routingBias in local mode", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }]
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.name).toBe("mock");
            expect(selected.routingBias).toBe(999);
        });
        it("filters by capability: toolCalls requirement excludes mock", () => {
            const profile = new AgentRoutingProfile(["mock", "claude-3.7"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }],
                requires: { toolCalls: true }
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.name).not.toBe("mock");
            expect(selected.supports.toolCalls).toBe(true);
        });
        it("filters by capability: vision requirement", () => {
            const profile = new AgentRoutingProfile(["mock", "claude-3.7"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }],
                requires: { vision: true }
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.supports.vision).toBe(true);
        });
        it("fallback chain: prefers primary, falls back to fallback", () => {
            const profile = new AgentRoutingProfile(["mock"], ["claude-3.7"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }],
                requires: { toolCalls: true }
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.name).toBe("claude-3.7");
        });
        it("routingBias ordering: higher score wins", () => {
            const profile = new AgentRoutingProfile(["mock", "claude-3.7"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }]
            };
            const selected = router.selectModel(profile, payload);
            const mockSpec = getModelSpec("mock");
            const claudeSpec = getModelSpec("claude-3.7");
            expect((mockSpec.routingBias ?? 0) > (claudeSpec.routingBias ?? 0)).toBe(true);
            expect(selected.name).toBe("mock");
        });
        it("capability scoring boosts models with required features", () => {
            const profile = new AgentRoutingProfile(["mock", "gpt-4.1"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }],
                requires: { vision: true }
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.supports.vision).toBe(true);
            expect(selected.name).toBe("gpt-4.1");
        });
        it("throws if no models satisfy requirements", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: [{ role: "user", content: "test" }],
                requires: { toolCalls: true }
            };
            expect(() => router.selectModel(profile, payload)).toThrow();
        });
    });
    describe("Agent Direct Invocation: Routing Correctness", () => {
        it("OrchestratorAgent.runPlan() routes with toolCalls requirement", async () => {
            const agent = new OrchestratorAgent();
            const result = await agent.runPlan("test plan");
            expect(result).toBeDefined();
            expect(typeof result).toBe("string");
        });
        it("OrchestratorAgent response includes mock signature", async () => {
            const agent = new OrchestratorAgent();
            const result = await agent.runPlan("test plan");
            expect(result).toContain("[MOCK:mock]");
        });
        it("EnrichmentAgent.enrich() routes to mock in local mode", async () => {
            const agent = new EnrichmentAgent();
            const result = await agent.enrich("test document");
            expect(result).toBeDefined();
            expect(typeof result).toBe("string");
        });
        it("EnrichmentAgent response includes mock signature", async () => {
            const agent = new EnrichmentAgent();
            const result = await agent.enrich("test document");
            expect(result).toContain("[MOCK:mock]");
        });
        it("SynthesisAgent.synthesize() routes to mock in local mode", async () => {
            const agent = new SynthesisAgent();
            const result = await agent.synthesize(["chunk1", "chunk2"]);
            expect(result).toBeDefined();
            expect(typeof result).toBe("string");
        });
        it("SynthesisAgent response includes mock signature", async () => {
            const agent = new SynthesisAgent();
            const result = await agent.synthesize(["chunk1", "chunk2"]);
            expect(result).toContain("[MOCK:mock]");
        });
        it("AuditAgent.audit(primary, secondary) dual signature works", async () => {
            const agent = new AuditAgent();
            const result = await agent.audit("primary", "secondary");
            expect(result).toBeDefined();
            expect(result.primary).toBeDefined();
            expect(result.secondary).toBeDefined();
        });
        it("AuditAgent.audit(result) single signature works", async () => {
            const agent = new AuditAgent();
            const result = await agent.audit("single result");
            expect(result).toBeDefined();
            expect(result.primary).toBeDefined();
        });
        it("AuditAgent dual signature produces audit results", async () => {
            const agent = new AuditAgent();
            const result = await agent.audit("text a", "text b");
            expect(result.primaryModel).toBeDefined();
            expect(result.secondaryModel).toBeDefined();
            expect(result.score).toBeDefined();
            expect(typeof result.score).toBe("number");
        });
    });
    describe("Determinism Tests: Same Input → Same Output", () => {
        it("mock provider returns deterministic responses", async () => {
            const agent = new OrchestratorAgent();
            const input = "determinism test";
            const result1 = await agent.runPlan(input);
            const result2 = await agent.runPlan(input);
            expect(result1).toBe(result2);
        });
        it("enrichment agent is deterministic", async () => {
            const agent = new EnrichmentAgent();
            const input = "same document";
            const result1 = await agent.enrich(input);
            const result2 = await agent.enrich(input);
            expect(result1).toBe(result2);
        });
        it("synthesis agent is deterministic", async () => {
            const agent = new SynthesisAgent();
            const input = ["chunk 1", "chunk 2"];
            const result1 = await agent.synthesize(input);
            const result2 = await agent.synthesize(input);
            expect(result1).toBe(result2);
        });
        it("audit agent is deterministic for single-argument form", async () => {
            const agent = new AuditAgent();
            const input = "result to audit";
            const result1 = await agent.audit(input);
            const result2 = await agent.audit(input);
            expect(result1.primary).toBe(result2.primary);
            expect(result1.secondary).toBe(result2.secondary);
        });
        it("mock response structure is consistent", async () => {
            const agent = new OrchestratorAgent();
            const result = await agent.runPlan("test");
            expect(result).toMatch(/^\[MOCK:mock\]/);
            expect(result).toContain("test");
        });
        it("snapshot: orchestrator response format", async () => {
            const agent = new OrchestratorAgent();
            const result = await agent.runPlan("sample plan");
            expect(result).toMatchInlineSnapshot(`"[MOCK:mock] Run plan: sample plan"`);
        });
        it("snapshot: enrichment response format", async () => {
            const agent = new EnrichmentAgent();
            const result = await agent.enrich("sample doc");
            expect(result).toMatchInlineSnapshot(`"[MOCK:mock] Enrich this doc: sample doc"`);
        });
    });
    describe("Capability Filtering: Requirements Enforcement", () => {
        it("blocks toolCalls-incapable models when required", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true }
            };
            expect(() => router.selectModel(profile, payload)).toThrow("No models available for routing profile");
        });
        it("blocks vision-incapable models when required", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: [],
                requires: { vision: true }
            };
            expect(() => router.selectModel(profile, payload)).toThrow("No models available for routing profile");
        });
        it("allows all when no requirements specified", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.name).toBe("mock");
        });
        it("orchestrator requires toolCalls and gets capable model", () => {
            const profile = new AgentRoutingProfile(["fugu-ultra"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true }
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.supports.toolCalls).toBe(true);
        });
    });
    describe("Fallback Chain: Degradation Paths", () => {
        it("primary model unavailable, falls back to secondary", () => {
            const profile = new AgentRoutingProfile(["mock"], ["claude-3.7"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true }
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.name).toEqual("claude-3.7");
        });
        it("all in preferred fail, tries fallback list", () => {
            const profile = new AgentRoutingProfile(["mock"], ["claude-3.7", "fugu"]);
            const payload = {
                model: "",
                messages: [],
                requires: { toolCalls: true }
            };
            const selected = router.selectModel(profile, payload);
            expect(["claude-3.7", "fugu"]).toContain(selected.name);
        });
        it("considers fallback models with routingBias", () => {
            const profile = new AgentRoutingProfile(["mock"], ["gpt-4.1", "claude-3.7"]);
            const payload = {
                model: "",
                messages: []
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.name).toBe("mock");
        });
    });
    describe("Mode Enforcement: MAAL_MODE=local behavior", () => {
        it("cloud models excluded in local mode", () => {
            process.env.MAAL_MODE = "local";
            const profile = new AgentRoutingProfile(["claude-3.7", "mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.provider).toBe("mock");
        });
        it("local model available in local mode", () => {
            process.env.MAAL_MODE = "local";
            const profile = new AgentRoutingProfile(["mock"]);
            const payload = {
                model: "",
                messages: []
            };
            const selected = router.selectModel(profile, payload);
            expect(selected.name).toBe("mock");
        });
        it("ollama/local providers pass through in local mode", () => {
            const registry = loadModelRegistry();
            const allModels = Array.from(registry.values());
            const localProviders = allModels.filter(m => m.provider === "mock" || m.provider === "ollama" || m.provider === "local");
            expect(localProviders.length).toBeGreaterThan(0);
            expect(localProviders.some(m => m.name === "mock")).toBe(true);
        });
    });
});
//# sourceMappingURL=c-phase-routing.test.js.map