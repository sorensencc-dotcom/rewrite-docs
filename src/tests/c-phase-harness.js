import { ModelRouter } from "../core/modelRouter.js";
import { loadModelRegistry, getModelSpec } from "../core/modelRegistry.js";
import { AgentRoutingProfile } from "../agents/routingProfile.js";
import { OrchestratorAgent } from "../agents/orchestratorAgent.js";
import { EnrichmentAgent } from "../agents/enrichmentAgent.js";
import { SynthesisAgent } from "../agents/synthesisAgent.js";
import { AuditAgent } from "../agents/auditAgent.js";
const tests = {
    passed: 0,
    failed: 0,
    errors: []
};
function assert(condition, message) {
    if (!condition) {
        tests.failed++;
        tests.errors.push(`❌ ${message}`);
    }
    else {
        tests.passed++;
    }
}
async function runTests() {
    process.env.MAAL_MODE = "local";
    const router = new ModelRouter(loadModelRegistry());
    // Routing Tests
    {
        const profile = new AgentRoutingProfile(["mock", "claude-3.7", "fugu"]);
        const payload = {
            model: "",
            messages: [{ role: "user", content: "test" }]
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.name === "mock", "Routes to mock in local mode");
        assert(selected.provider === "mock", "Selected provider is mock");
    }
    {
        const profile = new AgentRoutingProfile(["mock"]);
        const payload = {
            model: "",
            messages: [{ role: "user", content: "test" }]
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.routingBias === 999, "Mock has routingBias 999");
    }
    {
        // Temporarily switch to hybrid mode for capability tests
        process.env.MAAL_MODE = "hybrid";
        const profile = new AgentRoutingProfile(["fugu-ultra", "mock"]);
        const payload = {
            model: "",
            messages: [{ role: "user", content: "test" }],
            requires: { toolCalls: true }
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.name !== "mock", "Excludes mock when toolCalls required");
        assert(selected.supports.toolCalls === true, "Selected model supports toolCalls");
        process.env.MAAL_MODE = "local";
    }
    {
        // Test in hybrid mode
        process.env.MAAL_MODE = "hybrid";
        const profile = new AgentRoutingProfile(["mock", "claude-3.7"]);
        const payload = {
            model: "",
            messages: [{ role: "user", content: "test" }],
            requires: { vision: true }
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.supports.vision === true, "Selected model supports vision");
        process.env.MAAL_MODE = "local";
    }
    {
        const profile = new AgentRoutingProfile(["mock"], ["claude-3.7"]);
        const payload = {
            model: "",
            messages: [{ role: "user", content: "test" }],
            requires: { toolCalls: true }
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.name === "claude-3.7", "Falls back to secondary with toolCalls");
    }
    {
        const profile = new AgentRoutingProfile(["mock", "claude-3.7"]);
        const payload = {
            model: "",
            messages: [{ role: "user", content: "test" }]
        };
        const selected = router.selectModel(profile, payload);
        const mockSpec = getModelSpec("mock");
        const claudeSpec = getModelSpec("claude-3.7");
        assert((mockSpec.routingBias ?? 0) > (claudeSpec.routingBias ?? 0), "Mock routingBias higher than claude");
        assert(selected.name === "mock", "Mock wins on routingBias ordering");
    }
    // Agent Direct Invocation
    {
        const agent = new OrchestratorAgent();
        const result = await agent.runPlan("test plan");
        assert(result !== undefined, "OrchestratorAgent returns result");
        assert(typeof result === "string", "Result is string");
        assert(result.includes("[MOCK:mock]"), "Response includes mock signature");
    }
    {
        const agent = new EnrichmentAgent();
        const result = await agent.enrich("test document");
        assert(result !== undefined, "EnrichmentAgent returns result");
        assert(typeof result === "string", "Result is string");
        assert(result.includes("[MOCK:mock]"), "Response includes mock signature");
    }
    {
        const agent = new SynthesisAgent();
        const result = await agent.synthesize(["chunk1", "chunk2"]);
        assert(result !== undefined, "SynthesisAgent returns result");
        assert(typeof result === "string", "Result is string");
        assert(result.includes("[MOCK:mock]"), "Response includes mock signature");
    }
    {
        const agent = new AuditAgent();
        const result = await agent.audit("primary", "secondary");
        assert(result !== undefined, "AuditAgent dual signature works");
        assert(result.primary !== undefined, "Audit has primary field");
        assert(result.secondary !== undefined, "Audit has secondary field");
    }
    {
        const agent = new AuditAgent();
        const result = await agent.audit("single result");
        assert(result !== undefined, "AuditAgent single signature works");
        assert(result.primary !== undefined, "Audit has primary field");
    }
    // Determinism Tests
    {
        const agent = new OrchestratorAgent();
        const input = "determinism test";
        const result1 = await agent.runPlan(input);
        const result2 = await agent.runPlan(input);
        assert(result1 === result2, "Orchestrator is deterministic");
    }
    {
        const agent = new EnrichmentAgent();
        const input = "same document";
        const result1 = await agent.enrich(input);
        const result2 = await agent.enrich(input);
        assert(result1 === result2, "Enrichment is deterministic");
    }
    {
        const agent = new SynthesisAgent();
        const input = ["chunk 1", "chunk 2"];
        const result1 = await agent.synthesize(input);
        const result2 = await agent.synthesize(input);
        assert(result1 === result2, "Synthesis is deterministic");
    }
    {
        const agent = new AuditAgent();
        const input = "result to audit";
        const result1 = await agent.audit(input);
        const result2 = await agent.audit(input);
        assert(result1.primary === result2.primary, "Audit primary is deterministic");
        assert(result1.secondary === result2.secondary, "Audit secondary is deterministic");
    }
    // Capability Filtering
    {
        const profile = new AgentRoutingProfile(["mock"]);
        const payload = {
            model: "",
            messages: [],
            requires: { toolCalls: true }
        };
        try {
            router.selectModel(profile, payload);
            assert(false, "Throws when toolCalls required but unavailable");
        }
        catch (e) {
            assert(true, "Throws when toolCalls required but unavailable");
        }
    }
    {
        const profile = new AgentRoutingProfile(["mock"]);
        const payload = {
            model: "",
            messages: [],
            requires: { vision: true }
        };
        try {
            router.selectModel(profile, payload);
            assert(false, "Throws when vision required but unavailable");
        }
        catch (e) {
            assert(true, "Throws when vision required but unavailable");
        }
    }
    {
        const profile = new AgentRoutingProfile(["mock"]);
        const payload = {
            model: "",
            messages: []
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.name === "mock", "Allows all when no requirements specified");
    }
    // Fallback Chain
    {
        const profile = new AgentRoutingProfile(["mock"], ["claude-3.7"]);
        const payload = {
            model: "",
            messages: [],
            requires: { toolCalls: true }
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.name === "claude-3.7", "Falls back when primary unavailable");
    }
    {
        const profile = new AgentRoutingProfile(["mock"], ["claude-3.7", "fugu"]);
        const payload = {
            model: "",
            messages: [],
            requires: { toolCalls: true }
        };
        const selected = router.selectModel(profile, payload);
        assert(["claude-3.7", "fugu"].includes(selected.name), "Tries fallback list");
    }
    // Mode Enforcement
    {
        process.env.MAAL_MODE = "local";
        const profile = new AgentRoutingProfile(["claude-3.7", "mock"]);
        const payload = {
            model: "",
            messages: []
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.provider === "mock", "Cloud models excluded in local mode");
    }
    {
        const profile = new AgentRoutingProfile(["mock"]);
        const payload = {
            model: "",
            messages: []
        };
        const selected = router.selectModel(profile, payload);
        assert(selected.name === "mock", "Local model available in local mode");
    }
    // Summary
    if (tests.failed > 0) {
        process.exit(1);
    }
    else {
        process.exit(0);
    }
}
runTests().catch(() => {
    process.exit(1);
});
//# sourceMappingURL=c-phase-harness.js.map