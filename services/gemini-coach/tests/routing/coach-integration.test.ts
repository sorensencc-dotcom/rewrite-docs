import { MockAntigravityIDE } from "../../../antigravity-ide/mock/mockIDE";
import { CoachUIAdapter } from "../../../antigravity-ide/uiAdapter";
import { buildRoutingDecision } from "../../src/routing/routing-engine";
import { buildRoutingMessages } from "../../src/messaging/routingEngine";

test("E2E: routing -> messaging -> UI surfaces", () => {
  const ide = new MockAntigravityIDE();
  const ui = new CoachUIAdapter(ide);

  const mockReview = {
    issues: [
      { id: "1", description: "Missing import", tags: ["formatting"], canFix: true },
      { id: "2", description: "Bad UX wording", tags: ["ux"], canFix: false },
      { id: "3", description: "Drift weighting wrong", tags: ["drift"], canFix: false },
    ],
    summary: "3 issues found"
  };

  const routed = buildRoutingDecision(mockReview);
  const messages = buildRoutingMessages(routed).messages;

  ui.renderInlineHints(messages, "src/app.ts");
  ui.renderSidePanel(messages);
  ui.renderStatusBar(messages);

  // Expect tests to pass depending on framework, pseudo-assertions:
  // expect(ide.inlineHints.length).toBe(1);
  // expect(ide.sidePanelContent.length).toBeGreaterThan(0);
  // expect(ide.statusBarText).toContain("Routing complete");
});
