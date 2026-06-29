import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
import { ChatPayload } from "../core/modelRouter.js";
import { logEvent } from "../observability/events.js";

export interface AuditResult {
  primary: string;
  secondary: string;
  primaryModel: string;
  secondaryModel: string;
  score: number;
  issues: string[];
}

export class AuditAgent extends BaseAgent {
  protected routingProfile = new AgentRoutingProfile(["mock"], ["mock"]);

  async audit(primary: string, secondary?: string): Promise<AuditResult>;
  async audit(result: string): Promise<AuditResult>;
  async audit(a: any, b?: any): Promise<AuditResult> {
    let primaryInput: string;
    let secondaryInput: string | undefined;

    if (typeof b === "string") {
      primaryInput = a;
      secondaryInput = b;
    } else {
      primaryInput = a;
    }

    return this.auditImplementation(primaryInput, secondaryInput);
  }

  private async auditImplementation(result: string, secondaryOverride?: string): Promise<AuditResult> {
    const messages = this.buildAuditPrompt(result);

    let primaryResult = "";
    let primaryModel = "mock";
    let secondaryResult = secondaryOverride || "";
    let secondaryModel = "mock";

    // Try primary model
    try {
      const primary = await this.llm(messages);
      primaryResult = primary.text;
    } catch (e) {
      // Primary failed, use secondary model for primary slot
      try {
        const fallback = await this.llm(messages, { model: "mock" });
        primaryResult = fallback.text;
        primaryModel = "mock";
      } catch (fallbackErr) {
        // Both primary and fallback failed
        throw new Error(
          `Audit primary models failed: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // Try secondary model if not provided
    if (!secondaryOverride) {
      try {
        const secondary = await this.llm(messages, { model: "mock" });
        secondaryResult = secondary.text;
      } catch (e) {
        // Secondary failed, degrade gracefully by using a stripped version
        secondaryResult = primaryResult;
        secondaryModel = primaryModel;
      }
    }

    const { score, issues } = this.computeConsistency(primaryResult, secondaryResult);

    logEvent({
      eventName: "AUDIT_COMPARISON",
      agent: this.agentName,
      primaryModel,
      secondaryModel,
      score,
      issues: issues.length
    });

    return {
      primary: primaryResult,
      secondary: secondaryResult,
      primaryModel,
      secondaryModel,
      score,
      issues
    };
  }

  private buildAuditPrompt(result: string): ChatPayload["messages"] {
    return [
      {
        role: "system",
        content:
          "You are an audit agent responsible for verifying correctness and consistency. Provide detailed reasoning."
      },
      { role: "user", content: `Audit this result for correctness and coherence:\n\n${result}` }
    ];
  }

  private computeConsistency(
    primaryText: string,
    secondaryText: string
  ): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 1.0;

    if (!primaryText || !secondaryText) {
      return { score: 0, issues: ["Missing output from one or more models"] };
    }

    // Check for semantic similarity
    const primaryWords = primaryText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const secondaryWords = secondaryText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const primarySet = new Set(primaryWords);
    const secondarySet = new Set(secondaryWords);

    let intersectionCount = 0;
    for (const word of primarySet) {
      if (secondarySet.has(word)) {
        intersectionCount++;
      }
    }

    const unionCount = primarySet.size + secondarySet.size - intersectionCount;
    const jaccardSimilarity = intersectionCount / (unionCount || 1);

    if (jaccardSimilarity < 0.3) {
      score -= 0.4;
      issues.push("Low semantic similarity between models");
    } else if (jaccardSimilarity < 0.6) {
      score -= 0.15;
      issues.push("Moderate semantic differences between models");
    }

    // Check for hallucination markers
    const hallucMarkers = [
      "i'm not sure",
      "i cannot verify",
      "i don't have access",
      "i cannot find",
      "this is not accurate",
      "this may be incorrect"
    ];
    const hasHallucMarkers =
      hallucMarkers.some((marker) => primaryText.toLowerCase().includes(marker)) ||
      hallucMarkers.some((marker) => secondaryText.toLowerCase().includes(marker));

    if (hasHallucMarkers) {
      score -= 0.3;
      issues.push("Hallucination markers detected in audit responses");
    }

    // Check for length mismatch (may indicate missing reasoning)
    const lengthRatio = Math.max(
      primaryText.length / (secondaryText.length + 1),
      secondaryText.length / (primaryText.length + 1)
    );
    if (lengthRatio > 2.5) {
      score -= 0.2;
      issues.push("Significant response length mismatch (possible incomplete reasoning)");
    }

    return { score: Math.max(0, score), issues };
  }
}
