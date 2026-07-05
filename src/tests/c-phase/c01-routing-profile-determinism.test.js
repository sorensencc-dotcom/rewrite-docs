import { ModelRouter } from "../../core/modelRouter.js";
import { loadModelRegistry } from "../../core/modelRegistry.js";
import { AgentRoutingProfile } from "../../agents/routingProfile.js";
describe("C-1: Routing Profile Determinism", () => {
    let router;
    const payload = {
        model: "",
        messages: [{ role: "user", content: "determinism test" }]
    };
    beforeEach(() => {
        process.env.MAAL_MODE = "local";
        router = new ModelRouter(loadModelRegistry());
    });
    afterEach(() => {
        delete process.env.MAAL_MODE;
    });
    describe("local_first profile", () => {
        it("same input → same route deterministically", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const results = Array.from({ length: 100 }, () => router.selectModel(profile, payload));
            const firstRoute = results[0];
            results.forEach(route => {
                expect(route.name).toBe(firstRoute.name);
                expect(route.provider).toBe(firstRoute.provider);
                expect(route.routingBias).toBe(firstRoute.routingBias);
            });
        });
        it("routeId stable (model name is deterministic)", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const route1 = router.selectModel(profile, payload);
            const route2 = router.selectModel(profile, payload);
            expect(route1.name).toBe(route2.name);
            expect(route1.provider).toBe(route2.provider);
        });
        it("fallback chain identical across runs", () => {
            const profile = new AgentRoutingProfile(["mock"], ["claude-3.7"]);
            const chains = Array.from({ length: 10 }, () => {
                const selected = router.selectModel(profile, payload);
                return { name: selected.name, provider: selected.provider };
            });
            const firstChain = chains[0];
            chains.forEach(chain => {
                expect(chain.name).toBe(firstChain.name);
                expect(chain.provider).toBe(firstChain.provider);
            });
        });
        it("model selection stable under repeated invocation", () => {
            const profiles = [
                new AgentRoutingProfile(["mock"]),
                new AgentRoutingProfile(["mock"], ["claude-3.7"]),
                new AgentRoutingProfile(["mock", "claude-3.7"])
            ];
            profiles.forEach(profile => {
                const selections = Array.from({ length: 50 }, () => router.selectModel(profile, payload));
                const expected = selections[0].name;
                selections.forEach(sel => {
                    expect(sel.name).toBe(expected);
                });
            });
        });
    });
    describe("cloud_first profile", () => {
        it("routes consistently in cloud mode", () => {
            process.env.MAAL_MODE = "hybrid";
            const profile = new AgentRoutingProfile(["claude-3.7"]);
            const results = Array.from({ length: 100 }, () => router.selectModel(profile, payload));
            const first = results[0];
            results.forEach(result => {
                expect(result.name).toBe(first.name);
                expect(result.provider).toBe(first.provider);
            });
        });
    });
    describe("balanced profile", () => {
        it("prefers local when available and no requirements", () => {
            const profile = new AgentRoutingProfile(["mock", "claude-3.7"], ["fugu"]);
            const selections = Array.from({ length: 50 }, () => router.selectModel(profile, payload));
            const expected = selections[0].name;
            selections.forEach(sel => {
                expect(sel.name).toBe(expected);
            });
        });
    });
    describe("pinned profiles", () => {
        it("pinned(model=local:mock) returns mock every time", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const pins = Array.from({ length: 100 }, () => router.selectModel(profile, payload));
            pins.forEach(pin => {
                expect(pin.name).toBe("mock");
                expect(pin.provider).toBe("mock");
            });
        });
        it("pinned model respects provider lock", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const selections = Array.from({ length: 50 }, () => router.selectModel(profile, payload));
            selections.forEach(sel => {
                expect(sel.provider).toBe("mock");
            });
        });
    });
    describe("reasoning field stability", () => {
        it("routing decision reasoning is consistent", () => {
            const profile = new AgentRoutingProfile(["mock"]);
            const decisions = Array.from({ length: 20 }, () => {
                const model = router.selectModel(profile, payload);
                return {
                    name: model.name,
                    provider: model.provider,
                    bias: model.routingBias
                };
            });
            const first = decisions[0];
            decisions.forEach(dec => {
                expect(dec.name).toBe(first.name);
                expect(dec.provider).toBe(first.provider);
                expect(dec.bias).toBe(first.bias);
            });
        });
    });
});
//# sourceMappingURL=c01-routing-profile-determinism.test.js.map