// Layer classification
export type Layer =
  | "LOCAL_LLM"
  | "GEMINI_COACH"
  | "CLAUDE_TORQUEQUERY"
  | "CIC"
  | "APP_CODE";

export interface Issue {
  id: string;
  description: string;
  tags: string[]; // e.g. ["ux", "metrics", "rules", "telemetry", "business-logic"]
}

export interface RoutingDecision {
  localLLM: Issue[];
  geminiCoach: Issue[];
  claudeTorqueQuery: Issue[];
  cic: Issue[];
  appCode: Issue[];
}

const KNOWN_TAGS = new Set([
  "formatting", "syntax", "small-refactor",
  "ux", "messaging", "ide", "trend", "personality",
  "rules", "metrics", "drift", "substrate", "skill-extraction",
  "telemetry", "cic", "execution",
  "rules-presentation", "metrics-display", "metrics-calculation", "metrics-coaching",
  "drift-coaching", "drift-display",
]);

function classifyLayer(issue: Issue): Layer {
  const t = new Set(issue.tags.map(tag => tag.toLowerCase()));

  if (t.has("formatting") || t.has("syntax") || t.has("small-refactor")) {
    return "LOCAL_LLM";
  }

  // Experience-layer work: UX, messaging, coaching, display
  if (
    t.has("ux") || t.has("messaging") || t.has("ide") || t.has("trend") || t.has("personality") ||
    t.has("rules-presentation") || t.has("metrics-display") || t.has("metrics-coaching") ||
    t.has("drift-coaching") || t.has("drift-display")
  ) {
    return "GEMINI_COACH";
  }

  // Substrate-layer work: computation, logic, metrics, intelligence
  if (
    t.has("rules") || t.has("metrics-calculation") || t.has("drift") ||
    t.has("substrate") || t.has("skill-extraction") ||
    (t.has("metrics") && !t.has("metrics-display") && !t.has("metrics-coaching"))
  ) {
    return "CLAUDE_TORQUEQUERY";
  }

  if (t.has("telemetry") || t.has("cic") || t.has("execution")) {
    return "CIC";
  }

  return "APP_CODE";
}

export function routeIssues(issues: Issue[]): RoutingDecision {
  const decision: RoutingDecision = {
    localLLM: [],
    geminiCoach: [],
    claudeTorqueQuery: [],
    cic: [],
    appCode: [],
  };

  for (const issue of issues) {
    const layer = classifyLayer(issue);
    switch (layer) {
      case "LOCAL_LLM":
        decision.localLLM.push(issue);
        break;
      case "GEMINI_COACH":
        decision.geminiCoach.push(issue);
        break;
      case "CLAUDE_TORQUEQUERY":
        decision.claudeTorqueQuery.push(issue);
        break;
      case "CIC":
        decision.cic.push(issue);
        break;
      case "APP_CODE":
        decision.appCode.push(issue);
        break;
    }
  }

  return decision;
}
