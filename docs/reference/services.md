---
title: "Services Reference"
summary: "# Services Reference"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Services Reference

Agentic experience services at `c:\dev\services\`. Two services exist; both are code-present and integration-stage (🔄).

**Status legend:** ✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential · ⛔ Deprecated

## Gemini Coach — 🔄

`services/gemini-coach/` — "Agentic Experience Layer" (package `gemini-coach` v1.0.0; TypeScript, Jest tests, `src/`, `tests/`).

Source modules (`src/`):

| Module | Role |
|--------|------|
| `routing/` | Request routing: `routing-engine.ts` (`buildRoutingDecision`), `routing-algorithm.ts`, `local-llm-schema.ts` (CodeReviewRequest/Response types) |
| `messaging/` | Routing message construction: `routingEngine.ts` (`buildRoutingMessages`), `routingMessages.ts` |
| `cic-hooks/` | CIC integration hooks |
| `ide/` | IDE-facing integration |
| `mcp/` | MCP server surface |
| `onboarding/`, `personality/`, `skills/`, `trend/` | Coach experience modules |

## Antigravity IDE — 🔄

`services/antigravity-ide/` — "Antigravity IDE integration layer for Gemini Coach" (package `antigravity-ide-coach` v1.0.0; React deps for the UI adapter).

| File/Dir | Role |
|----------|------|
| `integration.ts` | Main entry; defines the `AntigravityIDE` interface (`onFileSaved`, `showInlineHint`, `showSidePanel`, `updateStatusBar`, `applyPatch`) and wires Gemini Coach routing (`buildRoutingDecision`, `buildRoutingMessages`) into IDE events |
| `wsClient.ts` | WebSocket client |
| `patches.ts` + `applyFixesFlow.ts` | Patch representation + apply-fixes flow |
| `events.ts`, `commands.ts` | Event/command plumbing |
| `uiAdapter.ts`, `ui/` | React UI adapter |
| `binding/`, `mock/`, `src/` | IDE binding, mocks, additional source |

## Integration points

- **Routing behavior:** Antigravity IDE consumes Gemini Coach's routing engine directly (imports from `../gemini-coach/src/routing/`). This is service-level request routing, distinct from the CIC runtime tier routing in `src/cic-runtime/routing/` — see [Routing](../architecture/routing.md).
- **CIC hooks:** `gemini-coach/src/cic-hooks/` is the CIC-side integration surface.
- **Governance hooks:** 💡 no direct wiring from services into `governance/` exists in the service code today; governance applies at the CIC runtime layer beneath them.

## Related

- [Integration Overview](../integration/index.md) — services layer
- [Systems Overview](../systems/index.md)
