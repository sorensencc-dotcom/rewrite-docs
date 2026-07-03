import { CodeReviewRequest, CodeReviewResponse } from "../gemini-coach/src/routing/local-llm-schema";
import { buildRoutingDecision } from "../gemini-coach/src/routing/routing-engine";
import { buildRoutingMessages } from "../gemini-coach/src/messaging/routingEngine";
import { RoutingMessage } from "../gemini-coach/src/messaging/routingMessages";

export interface AntigravityIDE {
  onFileSaved(cb: (filePath: string, code: string, language: string) => void): void;
  showInlineHint(filePath: string, line: number, message: RoutingMessage): void;
  showSidePanel(messages: RoutingMessage[]): void;
  updateStatusBar(text: string): void;
  applyPatch(filePath: string, patch: string): Promise<void>;
}

export class CoachIntegration {
  constructor(
    private ide: AntigravityIDE,
    private localLLM: (req: CodeReviewRequest) => Promise<CodeReviewResponse>
  ) {}

  activate() {
    this.ide.onFileSaved(async (filePath, code, language) => {
      await this.handleReview(filePath, code, language);
    });
  }

  private async handleReview(filePath: string, code: string, language: string) {
    const review = await this.localLLM({ filePath, language, code });
    const routed = buildRoutingDecision(review);
    const messages = buildRoutingMessages(routed).messages;

    this.ide.showSidePanel(messages);

    const summary = messages.find(m => m.type === "ROUTING_SUMMARY");
    if (summary) this.ide.updateStatusBar(summary.body);
  }
}
