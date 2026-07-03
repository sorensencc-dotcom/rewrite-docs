export const mockRoutingMessages = [
  {
    id: "llm-fix",
    type: "LOCAL_LLM_FIXABLE",
    title: "Local LLM can fix 2 issues",
    body: "Cause: Minor formatting.\nEffect: Localized impact.\nFix: Local model will correct.",
    severity: "info"
  },
  {
    id: "gemini",
    type: "GEMINI_ISSUES",
    title: "Routed 1 issue to Gemini",
    body: "Cause: UX inconsistency.\nEffect: Messaging clarity.\nFix: Gemini will update surfaces.",
    severity: "info"
  },
  {
    id: "summary",
    type: "ROUTING_SUMMARY",
    title: "Routing complete",
    body: "Local LLM: 2\nGemini: 1\nClaude/TQ: 0\nCIC: 0\nEngineer: 0",
    severity: "info"
  }
];

export const mockSkills = [
  {
    name: "Refactor React Component",
    stability: 0.82,
    description: "User repeatedly performs the same refactor pattern."
  },
  {
    name: "Fix TypeScript Import Errors",
    stability: 0.91,
    description: "High stability across multiple sessions."
  }
];

export const mockDriftData = [
  {
    timestamp: "2026-06-25T10:00:00Z",
    drift: 0.12,
    contributors: ["stale-context"]
  },
  {
    timestamp: "2026-06-25T11:00:00Z",
    drift: 0.31,
    contributors: ["missing-review-event"]
  }
];
