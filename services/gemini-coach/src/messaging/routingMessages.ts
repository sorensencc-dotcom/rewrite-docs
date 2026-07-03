export interface RoutedWorkCounts {
  localLLM: number;
  geminiCoach: number;
  claudeTorqueQuery: number;
  cic: number;
  appCode: number;
}

export interface RoutingContext {
  summary: string;
}

export interface RoutingMessage {
  id: string;
  type:
    | "LOCAL_LLM_FIXABLE"
    | "LOCAL_LLM_PARTIAL"
    | "GEMINI_ISSUES"
    | "CLAUDE_TQ_ISSUES"
    | "CIC_ISSUES"
    | "ENGINEER_ISSUES"
    | "ROUTING_SUMMARY";
  title: string;
  body: string;
  severity: "info" | "warning" | "error";
}

export function buildLocalLLMFixableMessage(count: number): RoutingMessage {
  return {
    id: "local-llm-fixable",
    type: "LOCAL_LLM_FIXABLE",
    title: `Local LLM can fix ${count} issue${count === 1 ? "" : "s"}`,
    severity: "info",
    body: [
      `Cause: Minor structural or formatting problems detected.`,
      `Effect: Localized impact (syntax, imports, small refactors).`,
      `Fix: The local model will apply safe, deterministic corrections to these items.`,
    ].join("\n"),
  };
}

export function buildLocalLLMPartialMessage(): RoutingMessage {
  return {
    id: "local-llm-partial",
    type: "LOCAL_LLM_PARTIAL",
    title: "Local LLM can partially fix one or more issues",
    severity: "warning",
    body: [
      `Cause: Issues span both simple fixes and higher-level design or contract concerns.`,
      `Effect: Local model can address the mechanical portion but not the full behavior.`,
      `Fix: The local model will apply its subset of fixes; remaining work is routed to the appropriate layer (Gemini, Claude/TorqueQuery, CIC, or you).`,
    ].join("\n"),
  };
}

export function buildGeminiIssuesMessage(count: number): RoutingMessage {
  return {
    id: "gemini-issues",
    type: "GEMINI_ISSUES",
    title: `Routed ${count} issue${count === 1 ? "" : "s"} to Gemini Coach`,
    severity: "info",
    body: [
      `Cause: These items affect UX, messaging, IDE surfaces, trend logic, or personality.`,
      `Effect: They change how guidance is presented, not the underlying governance or metrics.`,
      `Fix: Gemini will update the experience-layer logic and messaging to correct these issues.`,
    ].join("\n"),
  };
}

export function buildClaudeTQIssuesMessage(count: number): RoutingMessage {
  return {
    id: "claude-tq-issues",
    type: "CLAUDE_TQ_ISSUES",
    title: `Routed ${count} issue${count === 1 ? "" : "s"} to Claude/TorqueQuery`,
    severity: "warning",
    body: [
      `Cause: These items affect rules, metrics, drift logic, substrate intelligence, or skill extraction.`,
      `Effect: They change how readiness, drift, and findings are computed.`,
      `Fix: Claude/TorqueQuery will adjust the intelligence layer deterministically to correct these issues.`,
    ].join("\n"),
  };
}

export function buildCICIssuesMessage(count: number): RoutingMessage {
  return {
    id: "cic-issues",
    type: "CIC_ISSUES",
    title: `Routed ${count} issue${count === 1 ? "" : "s"} to CIC`,
    severity: "warning",
    body: [
      `Cause: These items originate in CIC execution or telemetry (missing events, lifecycle mismatches).`,
      `Effect: They impact how TorqueQuery and the Coach see the session and request behavior.`,
      `Fix: CIC will patch the execution or telemetry paths to restore accurate signals.`,
    ].join("\n"),
  };
}

export function buildEngineerIssuesMessage(count: number): RoutingMessage {
  return {
    id: "engineer-issues",
    type: "ENGINEER_ISSUES",
    title: `${count} issue${count === 1 ? "" : "s"} require your attention`,
    severity: "error",
    body: [
      `Cause: These items belong to application or business logic.`,
      `Effect: They affect runtime behavior or product correctness.`,
      `Fix: Manual correction is recommended; the Coach can assist with suggestions, but you own the final decision.`,
    ].join("\n"),
  };
}

export function buildRoutingSummaryMessage(counts: RoutedWorkCounts): RoutingMessage {
  const { localLLM, geminiCoach, claudeTorqueQuery, cic, appCode } = counts;
  return {
    id: "routing-summary",
    type: "ROUTING_SUMMARY",
    title: "Routing complete",
    severity: "info",
    body: [
      `Local LLM: ${localLLM} issue${localLLM === 1 ? "" : "s"}`,
      `Gemini Coach: ${geminiCoach} issue${geminiCoach === 1 ? "" : "s"}`,
      `Claude/TorqueQuery: ${claudeTorqueQuery} issue${claudeTorqueQuery === 1 ? "" : "s"}`,
      `CIC: ${cic} issue${cic === 1 ? "" : "s"}`,
      `Engineer: ${appCode} issue${appCode === 1 ? "" : "s"}`,
      `Next step: Local model will apply its fixes; Gemini and Claude/TorqueQuery tasks are queued; CIC and engineer-owned items remain pending.`,
    ].join("\n"),
  };
}
