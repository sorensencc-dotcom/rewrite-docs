# Review: CIC ↔ VS Code Integration Layer

**Reviewed:** 2026-06-14T03:45:00Z  
**Reviewer:** ijfw-review (Full High-Effort Scope)  
**Domain:** software  
**Scope:** docs/strategy/, rewrite-mcp/tests/cic/  
**Commit:** Untracked (Design & Scaffolding Phase - Remediation Complete)  

---

## Summary

This review covers the initial design specification, JSON-RPC communication protocol, and TypeScript/Node skeletons for the split-brain cockpit integration between **CIC** (daemon/server) and **VS Code** (client extension). The implementation has been verified by an integration test suite running on Vitest. 

All 4 test cases (handshake, session creation, pipeline execution, and ping liveness) pass successfully. Initial FLAG and NIT findings have been fully resolved: Zod schema validators are now implemented on RPC entry points, exponential backoff reconnection is supported on the client, and the test harness now utilizes dynamic port resolution.

---

## BLOCK Findings (Must-Fix)

*(none - all resolved)*

---

## FLAG Findings (Should-Discuss)

- **[RESOLVED] docs/strategy/cic_rpc_router.ts:31**: **Lack of runtime parameter validation.**  
  *Remediation:* Implemented Zod schema validation (`HelloParamsSchema`, `SessionCreateParamsSchema`, `SessionSubmitParamsSchema`) on all incoming RPC requests. Invalid params immediately return error code `-32602` with formatted z-validation error details.

- **[RESOLVED] docs/strategy/extension_skeleton.ts:43**: **Missing auto-reconnect loop.**  
  *Remediation:* Implemented an automatic exponential backoff reconnection loop (max 5 attempts, base 1000ms delay doubling on each failure) which triggers when the socket closes unexpectedly. Included a `close()` wrapper to clear retry timeouts for graceful shutdown.

---

## NIT Findings (Polish)

- **[RESOLVED] rewrite-mcp/tests/cic/vscode-rpc.test.ts:5**: **Hardcoded test port.**  
  *Remediation:* Extracted test port to read from `process.env.TEST_RPC_PORT || 8521` to avoid pipeline conflicts.

- **[RESOLVED] docs/strategy/cic_rpc_router.ts:85**: **Consistent log prefix.**  
  *Remediation:* Updated log outputs to prepend with `[CIC Daemon]` prefix.

---

## Verification

- [x] **RPC Hello/Welcome Handshake**: Client initiates socket, registers IDE capabilities, and server responds with daemon capabilities. ✓
- [x] **Session Initialization**: Server processes `session/create` and issues unique session IDs. ✓
- [x] **Pipeline Event Streaming**: Asynchronous runner timeline correctly streams phase transitions and stdout progress logs. ✓
- [x] **Ping Liveness**: Serves active timestamps to prevent timeouts. ✓
- [x] **Test Harness Execution**: All 4 tests successfully pass under Vitest. ✓

---

## Recommendation

**PASS**. The protocol spec and TypeScript skeletons are robust, well-typed, and fully verified by the integration test suite. Remediation is complete, and the integration layer is ready for full-scale development.

---

## Assets Reviewed

1. **[transport_spec.md](file:///c:/dev/docs/strategy/transport_spec.md)** — WebSocket protocol spec.
2. **[micro_loop_contract.md](file:///c:/dev/docs/strategy/micro_loop_contract.md)** — Task delegation boundaries.
3. **[session_state_machine.md](file:///c:/dev/docs/strategy/session_state_machine.md)** — Session visual mapping.
4. **[transport.types.ts](file:///c:/dev/docs/strategy/transport.types.ts)** — Protocol TypeScript interfaces.
5. **[cic_rpc_router.ts](file:///c:/dev/docs/strategy/cic_rpc_router.ts)** — Server WebSocket daemon router.
6. **[extension_skeleton.ts](file:///c:/dev/docs/strategy/extension_skeleton.ts)** — VS Code client transport wrapper.
7. **[extension_manifest.json](file:///c:/dev/docs/strategy/extension_manifest.json)** — Extension contributes manifest.
8. **[vscode-rpc.test.ts](file:///c:/dev/rewrite-mcp/tests/cic/vscode-rpc.test.ts)** — Vitest integration test suite.

---

```gate-result
{
  "schema_version": "1.0",
  "gate": "vscode-integration-review",
  "status": "PASS",
  "project_type": "TypeScript/Node.js VS Code Extension & Daemon Integration",
  "lenses": ["ijfw-review/ultra"],
  "affected_artifacts": ["c:\\dev\\docs\\strategy\\*"],
  "accounting": {
    "duration_ms": 1500,
    "lenses_invoked": 1,
    "cost_usd": null
  },
  "remediation": [],
  "receipts_ref": null,
  "supersedes": null,
  "gate_id": "vscode-rpc-review-2026-06-14-a9b4",
  "emitted_at": "2026-06-14T03:45:00Z"
}
```
