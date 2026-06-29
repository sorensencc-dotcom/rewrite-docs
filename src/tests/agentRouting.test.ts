import { AgentRoutingProfile } from "../agents/routingProfile.js";

describe("agentRouting", () => {
  it("picks the highest scoring available model", () => {
    // Both are available, claude-3.7 (90) vs fugu-ultra (60)
    const profile = new AgentRoutingProfile(["claude-3.7", "fugu-ultra"]);
    expect(profile.pickModel()).toBe("claude-3.7");
  });

  it("falls back to lower score if needed", () => {
    // non-existent-model has score 0, fugu has score 40
    const profile = new AgentRoutingProfile(["non-existent-model"], ["fugu"]);
    expect(profile.pickModel()).toBe("fugu");
  });

  it("throws if no models valid", () => {
    const profile = new AgentRoutingProfile(["fake1"], ["fake2"]);
    expect(() => profile.pickModel()).toThrow();
  });
});
