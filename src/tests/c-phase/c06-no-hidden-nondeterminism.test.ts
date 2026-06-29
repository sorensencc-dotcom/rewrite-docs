import { ModelRouter } from "../../core/modelRouter.js";
import { loadModelRegistry } from "../../core/modelRegistry.js";
import { AgentRoutingProfile } from "../../agents/routingProfile.js";
import { ChatPayload } from "../../core/modelRouter.js";
import { OrchestratorAgent } from "../../agents/orchestratorAgent.js";

describe("C-6: No Hidden Nondeterminism", () => {
  let router: ModelRouter;

  beforeEach(() => {
    process.env.MAAL_MODE = "local";
    router = new ModelRouter(loadModelRegistry());
  });

  afterEach(() => {
    delete process.env.MAAL_MODE;
  });

  describe("no timestamp injection", () => {
    it("router output has no timestamp fields", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const model = router.selectModel(profile, payload);
      const json = JSON.stringify(model);

      expect(json).not.toMatch(/"(timestamp|createdAt|updatedAt|expiresAt)"/i);
    });

    it("routing decision payload no datetime", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const model = router.selectModel(profile, payload);

      expect(model.name).toBeTruthy();
      expect(typeof model.name).toBe("string");

      // Ensure name doesn't encode timestamp
      const parsed = parseInt(model.name);
      expect(isNaN(parsed) || model.name.length > 15).toBe(true);
    });
  });

  describe("no random() calls", () => {
    it("selection not affected by Math.random()", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      // Deterministic seed simulation (not truly testing random, but output check)
      const selections = Array.from({ length: 200 }, () =>
        router.selectModel(profile, payload)
      );

      const first = selections[0];
      const allSame = selections.every(s => s.name === first.name);

      expect(allSame).toBe(true);
    });

    it("routing bias applied consistently (no randomization)", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const biases = Array.from({ length: 100 }, () => {
        const model = router.selectModel(profile, payload);
        return model.routingBias ?? 0;
      });

      const expected = biases[0];
      biases.forEach(bias => {
        expect(bias).toBe(expected);
      });
    });
  });

  describe("no unstable JSON.stringify", () => {
    it("object key ordering deterministic", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const models = Array.from({ length: 30 }, () =>
        router.selectModel(profile, payload)
      );

      const firstKeys = Object.keys(models[0]).sort();

      models.forEach(model => {
        const keys = Object.keys(model).sort();
        expect(keys).toEqual(firstKeys);
      });
    });

    it("nested object key ordering stable", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const models = Array.from({ length: 20 }, () =>
        router.selectModel(profile, payload)
      );

      const firstSupportsKeys = Object.keys(models[0].supports).sort();

      models.forEach(model => {
        const keys = Object.keys(model.supports).sort();
        expect(keys).toEqual(firstSupportsKeys);
      });
    });
  });

  describe("no provider latency variance", () => {
    it("mock provider response latency not observable in selection", async () => {
      const agent = new OrchestratorAgent();

      const times = await Promise.all(
        Array.from({ length: 20 }, async () => {
          const start = process.hrtime.bigint();
          const result = await agent.runPlan("latency test");
          const end = process.hrtime.bigint();
          return {
            result,
            duration: Number(end - start)
          };
        })
      );

      // All results should be identical regardless of latency
      const firstResult = times[0].result;
      times.forEach(t => {
        expect(t.result).toBe(firstResult);
      });
    });
  });

  describe("no provider drift", () => {
    it("mock provider spec doesn't drift", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const specs = Array.from({ length: 50 }, () => {
        const model = router.selectModel(profile, payload);
        return JSON.stringify({
          name: model.name,
          provider: model.provider,
          type: model.type,
          supports: model.supports
        });
      });

      const first = specs[0];
      specs.forEach(spec => {
        expect(spec).toBe(first);
      });
    });
  });

  describe("no async race conditions", () => {
    it("100 parallel routing calls produce identical output", async () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(router.selectModel(profile, payload))
      );

      const results = await Promise.all(promises);

      const first = results[0];
      results.forEach(result => {
        expect(result.name).toBe(first.name);
        expect(result.provider).toBe(first.provider);
      });
    });

    it("100 parallel agent calls produce identical output", async () => {
      const agent = new OrchestratorAgent();

      const promises = Array.from({ length: 100 }, () =>
        agent.runPlan("race test")
      );

      const results = await Promise.all(promises);

      const first = results[0];
      results.forEach(result => {
        expect(result).toBe(first);
      });
    });

    it("concurrent routing under different profiles stays independent", async () => {
      const profiles = [
        new AgentRoutingProfile(["mock"]),
        new AgentRoutingProfile(["mock"], ["claude-3.7"]),
        new AgentRoutingProfile(["mock", "claude-3.7"])
      ];
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const promises = profiles.flatMap(profile =>
        Array.from({ length: 20 }, () =>
          Promise.resolve(router.selectModel(profile, payload))
        )
      );

      const results = await Promise.all(promises);
      const grouped = [
        results.slice(0, 20),
        results.slice(20, 40),
        results.slice(40, 60)
      ];

      grouped.forEach(group => {
        const first = group[0];
        group.forEach(result => {
          expect(result.name).toBe(first.name);
        });
      });
    });
  });

  describe("caching doesn't hide nondeterminism", () => {
    it("uncached selection still deterministic", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      // Simulate cache miss by using different payload objects
      const selections = Array.from({ length: 50 }, () => {
        const p: ChatPayload = {
          model: "",
          messages: [{ role: "user", content: "test" }]
        };
        return router.selectModel(profile, p);
      });

      const first = selections[0];
      selections.forEach(sel => {
        expect(sel.name).toBe(first.name);
      });
    });
  });

  describe("mode enforcement no variance", () => {
    it("MAAL_MODE=local mode enforced consistently", () => {
      process.env.MAAL_MODE = "local";
      const profile = new AgentRoutingProfile(["mock", "claude-3.7"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const modes = Array.from({ length: 50 }, () => {
        const model = router.selectModel(profile, payload);
        return model.provider;
      });

      const first = modes[0];
      modes.forEach(mode => {
        expect(mode).toBe(first);
        expect(mode).toBe("mock");
      });
    });

    it("mode doesn't leak between calls", () => {
      const p1 = new AgentRoutingProfile(["mock"]);
      const p2 = new AgentRoutingProfile(["claude-3.7"], ["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      process.env.MAAL_MODE = "local";
      const m1 = router.selectModel(p1, payload);
      expect(m1.provider).toBe("mock");

      process.env.MAAL_MODE = "local";
      const m2 = router.selectModel(p2, payload);
      expect(m2.provider).toBe("mock");
    });
  });

  describe("error surfaces deterministic", () => {
    it("error message same on repeated failure", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: [],
        requires: { toolCalls: true }
      };

      const errors = Array.from({ length: 10 }, () => {
        try {
          router.selectModel(profile, payload);
          return null;
        } catch (e) {
          return String(e);
        }
      });

      const first = errors[0];
      errors.forEach(err => {
        expect(err).toBe(first);
      });
    });
  });

  describe("1000-run stress test", () => {
    it("1000 consecutive runs → all identical", () => {
      const profile = new AgentRoutingProfile(["mock"]);
      const payload: ChatPayload = {
        model: "",
        messages: [{ role: "user", content: "stress test" }]
      };

      const results = Array.from({ length: 1000 }, () =>
        router.selectModel(profile, payload)
      );

      const uniqueNames = new Set(results.map(r => r.name));
      const uniqueProviders = new Set(results.map(r => r.provider));

      expect(uniqueNames.size).toBe(1);
      expect(uniqueProviders.size).toBe(1);
      expect(Array.from(uniqueNames)[0]).toBe("mock");
    });
  });
});
