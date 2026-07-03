import { RoutingMessage } from "../../gemini-coach/src/messaging/routingMessages";

export interface AntigravityUI {
  showInlineHint(filePath: string, line: number, text: string, severity: "info" | "warning" | "error"): void;
  showSidePanel(content: string): void;
  updateStatusBar(text: string): void;
}

export class CoachUIAdapter {
  constructor(private ui: AntigravityUI) {}

  renderInlineHints(messages: RoutingMessage[], filePath: string) {
    messages
      .filter(m => m.type === "LOCAL_LLM_FIXABLE" || m.type === "ENGINEER_ISSUES")
      .forEach(m => {
        this.ui.showInlineHint(filePath, 0, m.title, m.severity);
      });
  }

  renderSidePanel(messages: RoutingMessage[]) {
    const content = messages
      .map(m => `### ${m.title}\n${m.body}`)
      .join("\n\n---\n\n");

    this.ui.showSidePanel(content);
  }

  renderStatusBar(messages: RoutingMessage[]) {
    const summary = messages.find(m => m.type === "ROUTING_SUMMARY");
    if (summary) this.ui.updateStatusBar(summary.title);
  }
}
