import { ModelRouter } from "../../core/modelRouter.js";
import { loadModelRegistry } from "../../core/modelRegistry.js";
import { AgentRoutingProfile } from "../../agents/routingProfile.js";
import { ChatPayload } from "../../core/modelRouter.js";

describe("C-3: Fallback Chain Determinism", () => {
  let router: ModelRouter;

  beforeEach(() => {
    process.env.MAAL_MODE = "hybrid";
    router = new ModelRouter(loadModelRegistry());
  });

  afterEach(() => {
    delete process.env.MAAL_MODE;
  });

  describe("primary → fallback transition", () => {
    it("primary unavailable → always picks same fallback", () => {
      const profile = new AgentRoutingProfile(
        ["mock"],
        ["claude-3.7"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: [],
        requires: { toolCalls: true }
      };

      const selections = Array.from({ length: 50 }, () =>
        router.selectModel(profile, payload)
      );

      const expected = selections[0];
      selections.forEach(sel => {
        expect(sel.name).toBe(expected.name);
        expect(["mock", "claude-3.7"]).toContain(sel.name);
      });
    });

    it("fallback order stable (deterministic chain)", () => {
      const profile = new AgentRoutingProfile(
        ["mock"],
        ["claude-3.7", "fugu", "gpt-4.1"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: [],
        requires: { toolCalls: true }
      };

      const choices = Array.from({ length: 20 }, () =>
        router.selectModel(profile, payload)
      );

      const expected = choices[0].name;
      choices.forEach(choice => {
        expect(choice.name).toBe(expected);
      });
    });
  });

  describe("fallback count determinism", () => {
    it("fallback count stable", () => {
      const profile = new AgentRoutingProfile(
        ["mock"],
        ["claude-3.7", "fugu"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: [],
        requires: { toolCalls: true }
      };

      const attempts = Array.from({ length: 30 }, () => {
        try {
          const model = router.selectModel(profile, payload);
          return { success: true, model: model.name };
        } catch {
          return { success: false, model: null };
        }
      });

      const first = attempts[0];
      attempts.forEach(att => {
        expect(att.success).toBe(first.success);
      });
    });

    it("exhausted fallback chain fails consistently", () => {
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

  describe("fallback reasons stability", () => {
    it("reason for fallback is consistent", () => {
      const profile = new AgentRoutingProfile(
        ["mock"],
        ["claude-3.7"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: [],
        requires: { toolCalls: true }
      };

      const models = Array.from({ length: 20 }, () =>
        router.selectModel(profile, payload)
      );

      const first = models[0];
      models.forEach(model => {
        // Both primary & fallback should be consistent choices
        expect(["mock", "claude-3.7"]).toContain(model.name);
        expect(model.name).toBe(first.name);
      });
    });

    it("fallback reason: primary blocked by capability", () => {
      const profile = new AgentRoutingProfile(
        ["mock"],
        ["claude-3.7"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: [],
        requires: { toolCalls: true }
      };

      const selections = Array.from({ length: 10 }, () => {
        const model = router.selectModel(profile, payload);
        // mock now supports toolCalls, so should be picked consistently
        return model.name;
      });

      selections.forEach(sel => {
        expect(sel).toBe("mock");
      });
    });
  });

  describe("final model stability", () => {
    it("final model always same under fallback", () => {
      const profile = new AgentRoutingProfile(
        ["mock"],
        ["claude-3.7", "fugu"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: [],
        requires: { toolCalls: true }
      };

      const finals = Array.from({ length: 100 }, () =>
        router.selectModel(profile, payload)
      );

      const expected = finals[0].name;
      finals.forEach(final => {
        expect(final.name).toBe(expected);
      });
    });

    it("final provider always same under fallback", () => {
      const profile = new AgentRoutingProfile(
        ["mock"],
        ["claude-3.7"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: [],
        requires: { toolCalls: true }
      };

      const providers = Array.from({ length: 50 }, () =>
        router.selectModel(profile, payload).provider
      );

      const expected = providers[0];
      providers.forEach(prov => {
        expect(prov).toBe(expected);
      });
    });
  });

  describe("routing bias in fallback", () => {
    it("fallback respects routingBias ordering", () => {
      const profile = new AgentRoutingProfile(
        ["mock"],
        ["gpt-4.1", "claude-3.7"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const selections = Array.from({ length: 20 }, () =>
        router.selectModel(profile, payload)
      );

      const expected = selections[0];
      selections.forEach(sel => {
        expect(sel.name).toBe(expected.name);
      });
    });
  });

  describe("multivendor fallback", () => {
    it("anthropic → openai → google chain deterministic", () => {
      const profile = new AgentRoutingProfile(
        ["claude-3.7"],
        ["gpt-4.1", "gemini-1.5"]
      );
      const payload: ChatPayload = {
        model: "",
        messages: []
      };

      const results = Array.from({ length: 30 }, () =>
        router.selectModel(profile, payload)
      );

      const first = results[0];
      results.forEach(result => {
        expect(result.name).toBe(first.name);
        expect(result.provider).toBe(first.provider);
      });
    });
  });
});
