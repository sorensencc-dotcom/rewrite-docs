import { OrchestratorAgent } from "../../agents/orchestratorAgent.js";
import { EnrichmentAgent } from "../../agents/enrichmentAgent.js";
import { SynthesisAgent } from "../../agents/synthesisAgent.js";
import { AuditAgent } from "../../agents/auditAgent.js";
describe("C-4: Agent Determinism", () => {
    beforeEach(() => {
        process.env.MAAL_MODE = "local";
    });
    afterEach(() => {
        delete process.env.MAAL_MODE;
    });
    describe("OrchestratorAgent determinism", () => {
        it("same prompt → same callModel() payload", async () => {
            const agent = new OrchestratorAgent();
            const input = "deterministic plan";
            const result1 = await agent.runPlan(input);
            const result2 = await agent.runPlan(input);
            expect(result1).toBe(result2);
        });
        it("100 runs same input → identical outputs", async () => {
            const agent = new OrchestratorAgent();
            const input = "fixed test case";
            const results = await Promise.all(Array.from({ length: 100 }, () => agent.runPlan(input)));
            const expected = results[0];
            results.forEach(result => {
                expect(result).toBe(expected);
            });
        });
        it("trace fields stable", async () => {
            const agent = new OrchestratorAgent();
            const traces = await Promise.all(Array.from({ length: 10 }, async () => {
                const result = await agent.runPlan("trace test");
                return {
                    text: result,
                    length: result.length
                };
            }));
            const first = traces[0];
            traces.forEach(trace => {
                expect(trace.text).toBe(first.text);
                expect(trace.length).toBe(first.length);
            });
        });
        it("response includes mock signature consistently", async () => {
            const agent = new OrchestratorAgent();
            const sigs = await Promise.all(Array.from({ length: 20 }, async () => {
                const result = await agent.runPlan("sig test");
                return result.includes("[MOCK:mock]");
            }));
            sigs.forEach(hasSig => {
                expect(hasSig).toBe(true);
            });
        });
    });
    describe("EnrichmentAgent determinism", () => {
        it("same document → same enrichment", async () => {
            const agent = new EnrichmentAgent();
            const doc = "enrichment test document";
            const result1 = await agent.enrich(doc);
            const result2 = await agent.enrich(doc);
            expect(result1).toBe(result2);
        });
        it("50 runs produce identical output", async () => {
            const agent = new EnrichmentAgent();
            const doc = "fixed document";
            const results = await Promise.all(Array.from({ length: 50 }, () => agent.enrich(doc)));
            const expected = results[0];
            results.forEach(result => {
                expect(result).toBe(expected);
            });
        });
        it("different documents → different outputs (baseline)", async () => {
            const agent = new EnrichmentAgent();
            const a = await agent.enrich("document A");
            const b = await agent.enrich("document B");
            expect(a).not.toBe(b);
            expect(a).toContain("document A");
            expect(b).toContain("document B");
        });
        it("mock signature stable", async () => {
            const agent = new EnrichmentAgent();
            const sigs = await Promise.all(Array.from({ length: 15 }, async () => {
                const result = await agent.enrich("sig test");
                return result.startsWith("[MOCK:mock]");
            }));
            sigs.forEach(hasSig => {
                expect(hasSig).toBe(true);
            });
        });
    });
    describe("SynthesisAgent determinism", () => {
        it("same chunks → same synthesis", async () => {
            const agent = new SynthesisAgent();
            const chunks = ["chunk1", "chunk2", "chunk3"];
            const result1 = await agent.synthesize(chunks);
            const result2 = await agent.synthesize(chunks);
            expect(result1).toBe(result2);
        });
        it("100 runs identical input → identical output", async () => {
            const agent = new SynthesisAgent();
            const chunks = ["fixed", "chunks"];
            const results = await Promise.all(Array.from({ length: 100 }, () => agent.synthesize(chunks)));
            const expected = results[0];
            results.forEach(result => {
                expect(result).toBe(expected);
            });
        });
        it("chunk order matters (deterministic)", async () => {
            const agent = new SynthesisAgent();
            const forward = await agent.synthesize(["a", "b", "c"]);
            const reverse = await agent.synthesize(["c", "b", "a"]);
            expect(forward).not.toBe(reverse);
        });
        it("mock signature in synthesis", async () => {
            const agent = new SynthesisAgent();
            const sigs = await Promise.all(Array.from({ length: 10 }, async () => {
                const result = await agent.synthesize(["test"]);
                return result.includes("[MOCK:mock]");
            }));
            sigs.forEach(hasSig => {
                expect(hasSig).toBe(true);
            });
        });
    });
    describe("AuditAgent determinism", () => {
        it("single-argument form is deterministic", async () => {
            const agent = new AuditAgent();
            const input = "audit test";
            const result1 = await agent.audit(input);
            const result2 = await agent.audit(input);
            expect(result1.primary).toBe(result2.primary);
            expect(result1.primaryModel).toBe(result2.primaryModel);
        });
        it("dual-argument form is deterministic", async () => {
            const agent = new AuditAgent();
            const primary = "primary text";
            const secondary = "secondary text";
            const result1 = await agent.audit(primary, secondary);
            const result2 = await agent.audit(primary, secondary);
            expect(result1.primary).toBe(result2.primary);
            expect(result1.secondary).toBe(result2.secondary);
            expect(result1.primaryModel).toBe(result2.primaryModel);
            expect(result1.secondaryModel).toBe(result2.secondaryModel);
        });
        it("50 runs single-arg form identical", async () => {
            const agent = new AuditAgent();
            const input = "fixed audit";
            const results = await Promise.all(Array.from({ length: 50 }, () => agent.audit(input)));
            const expected = results[0];
            results.forEach(result => {
                expect(result.primary).toBe(expected.primary);
                expect(result.primaryModel).toBe(expected.primaryModel);
                expect(result.score).toBe(expected.score);
            });
        });
        it("dual form audit score deterministic", async () => {
            const agent = new AuditAgent();
            const scores = await Promise.all(Array.from({ length: 20 }, async () => {
                const result = await agent.audit("text a", "text b");
                return result.score;
            }));
            const expected = scores[0];
            scores.forEach(score => {
                expect(score).toBe(expected);
            });
        });
        it("audit traces stable", async () => {
            const agent = new AuditAgent();
            const traces = await Promise.all(Array.from({ length: 10 }, async () => {
                const result = await agent.audit("trace test");
                return result;
            }));
            const first = traces[0];
            traces.forEach(trace => {
                expect(trace.primary).toBe(first.primary);
                expect(trace.primaryModel).toBe(first.primaryModel);
            });
        });
    });
    describe("cross-agent determinism", () => {
        it("different agents same input produce stable patterns", async () => {
            const orch = new OrchestratorAgent();
            const enrich = new EnrichmentAgent();
            const synth = new SynthesisAgent();
            const input = "test";
            const orchResults = await Promise.all(Array.from({ length: 5 }, () => orch.runPlan(input)));
            const enrichResults = await Promise.all(Array.from({ length: 5 }, () => enrich.enrich(input)));
            const synthResults = await Promise.all(Array.from({ length: 5 }, () => synth.synthesize([input])));
            const orchFirst = orchResults[0];
            const enrichFirst = enrichResults[0];
            const synthFirst = synthResults[0];
            orchResults.forEach(r => expect(r).toBe(orchFirst));
            enrichResults.forEach(r => expect(r).toBe(enrichFirst));
            synthResults.forEach(r => expect(r).toBe(synthFirst));
        });
    });
    describe("agent.calls[] stability", () => {
        it("agent routing decisions stable", async () => {
            const agent = new OrchestratorAgent();
            const calls = await Promise.all(Array.from({ length: 30 }, async () => {
                const result = await agent.runPlan("call test");
                return result.startsWith("[MOCK:mock]");
            }));
            calls.forEach(call => {
                expect(call).toBe(true);
            });
        });
    });
    describe("agent.receipts[] stability", () => {
        it("mock provider receipts consistent", async () => {
            const agent = new OrchestratorAgent();
            const receipts = await Promise.all(Array.from({ length: 20 }, async () => {
                const result = await agent.runPlan("receipt test");
                return {
                    hasSignature: result.includes("[MOCK:mock]"),
                    text: result
                };
            }));
            receipts.forEach(receipt => {
                expect(receipt.hasSignature).toBe(true);
                expect(receipt.text).toBe(receipts[0].text);
            });
        });
    });
});
//# sourceMappingURL=c04-agent-determinism.test.js.map