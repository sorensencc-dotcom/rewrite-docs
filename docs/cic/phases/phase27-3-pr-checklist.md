---
title: "PHASE27 3 PR CHECKLIST"
summary: "# PHASE 27.3 — PR MERGE CHECKLIST **Feature:** Output Validation Implementation Sweep (Adapters) **Files:** 8 core + 3 test files **Test count:** 90+ unit + 35+ integration tests **Definition of ready:** All boxes checked before merge to master"
created: "2026-07-03T19:43:45.463Z"
updated: "2026-07-03T19:43:45.463Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# PHASE 27.3 — PR MERGE CHECKLIST
**Feature:** Output Validation Implementation Sweep (Adapters)  
**Files:** 8 core + 3 test files  
**Test count:** 90+ unit + 35+ integration tests  
**Definition of ready:** All boxes checked before merge to master

---

# REVIEWER CHECKLIST

## Pre-Review (Before Requesting Review)

- [ ] All 8 adapter files compile without TypeScript errors
- [ ] All 3 test files compile and run (no failed imports)
- [ ] `npm test` passes locally (all 125+ tests green)
- [ ] No `console.log`, `debugger`, or commented-out code left
- [ ] All commits follow Conventional Commits format
- [ ] Commit messages reference this Phase 27.3
- [ ] No merge conflicts in base branch
- [ ] Working branch is up-to-date with master

---

## Functional Requirements

### **Adapter Validation**
- [ ] All 5 adapters (Navigate, Screenshot, Generate, Puppeteer, Anthropic) return `AdapterResponse<T>` envelope
- [ ] No adapter returns raw Puppeteer/Anthropic output (all wrapped)
- [ ] All adapters populate `meta` (adapter, durationMs, timestamp)
- [ ] Success responses have `ok=true`, `data`, no `error`
- [ ] Error responses have `ok=false`, `error`, no `data`

### **Error Handling**
- [ ] All adapters catch thrown errors and return `AdapterResponse` with `ok=false`
- [ ] All error codes are standardized (uppercase, snake_case: `ADAPTER_FAILED`, etc.)
- [ ] Error details object matches error code (no generic "error" field)
- [ ] Each adapter has documented error codes (5 per adapter minimum)

### **Schema Validation (Zod)**
- [ ] All result types have corresponding Zod schemas (`ScreenshotResultSchema`, etc.)
- [ ] Schemas are strict (extra fields rejected or ignored)
- [ ] Schemas validate type safety (number bounds, string patterns, etc.)
- [ ] `safeParse` used in all adapters (not `.parse` which throws)
- [ ] Zod validation failures return `ok=false` with `INVALID_*_RESULT` error code

### **Post-Execution Safety Checks**
- [ ] BrowserNavigateAdapter: checks for `about:blank`, validates final URL
- [ ] BrowserScreenshotAdapter: validates PNG header (0x89504E47), checks size < 5MB
- [ ] ModelGenerateAdapter: sanitizes text, validates length, checks JSON completeness if expected
- [ ] PuppeteerEngine: detects crash markers in logs, forces `success=false` if found
- [ ] AnthropicClient: sanitizes text, rejects empty responses, validates length

### **Sanitization**
- [ ] `sanitizeText` removes null bytes (`\x00`)
- [ ] `sanitizeText` removes ANSI escape codes (`[31m`, `[0m`, etc.)
- [ ] `sanitizeText` trims whitespace (leading/trailing)
- [ ] No sanitization removes legitimate content (Unicode, newlines, tabs preserved)

### **Helpers Module**
- [ ] `makeSuccess(data, adapter, startTime)` returns valid success envelope
- [ ] `makeError(code, details, adapter, startTime)` returns valid error envelope
- [ ] Envelope helpers never return both `ok=true` and `error` field
- [ ] Envelope helpers never return both `ok=false` and `data` field
- [ ] `durationMs` calculated correctly (Date.now() - startTime)
- [ ] `timestamp` is ISO string (YYYY-MM-DDTHH:MM:SS format)

### **Guard Helpers**
- [ ] `validateFinalUrl` returns false for `about:blank`, `data:`, `javascript:`
- [ ] `validatePng` checks PNG header (bytes 0-3: 0x89 0x50 0x4E 0x47)
- [ ] `validateScreenshotSize` enforces 5MB limit
- [ ] `validateTextLength` enforces 10KB max, rejects empty
- [ ] `validateJsonCompleteness` detects incomplete JSON
- [ ] `detectCrashInLogs` finds "Target closed" and "Protocol error" markers

---

## Test Coverage

### **Unit Tests: Envelope Helpers**
- [ ] `envelope.test.ts` has 45+ test cases
- [ ] Tests cover success envelope (structure, timing, data types)
- [ ] Tests cover error envelope (structure, timing, error codes)
- [ ] Tests cover envelope invariants (ok/data/error mutual exclusion)
- [ ] Tests cover edge cases (null, undefined, large payloads, Unicode)
- [ ] All tests passing (no skipped or `.only` tests)

### **Unit Tests: Guard Helpers**
- [ ] `guards.test.ts` has 50+ test cases
- [ ] Tests cover each guard function (validateUrl, PNG, size, text, JSON, logs)
- [ ] Tests cover valid inputs (should pass)
- [ ] Tests cover invalid inputs (should fail)
- [ ] Tests cover edge cases (empty, oversized, malformed)
- [ ] Performance tests confirm <10ms for large operations
- [ ] All tests passing (no skipped or `.only` tests)

### **Integration Tests**
- [ ] `adapters.integration.test.ts` has 35+ test cases across 10 sections
- [ ] Tests cover all 5 adapters in valid envelope flow
- [ ] Tests cover all 5 adapters in error envelope flow
- [ ] Tests cover orchestrator chain (navigate → screenshot → generate)
- [ ] Tests cover partial failures (one adapter fails, others continue)
- [ ] Tests cover WS broadcast (success events + error events)
- [ ] Tests cover schema validation failures
- [ ] Tests cover sanitization (control char removal, ANSI codes)
- [ ] Tests cover concurrent execution (no race conditions)
- [ ] Tests cover meta timing accuracy
- [ ] All tests passing (no skipped or `.only` tests)

### **Test Coverage Metrics**
- [ ] `npm test` reports ≥90% line coverage for validation module
- [ ] `npm test` reports ≥90% branch coverage for adapters
- [ ] No uncovered branches in adapter error paths
- [ ] No uncovered branches in envelope/guard functions

---

## Integration Points

### **Orchestrator Integration**
- [ ] Orchestrator can call all 5 adapters without type errors
- [ ] Orchestrator receives `AdapterResponse` from all adapters
- [ ] Orchestrator can sequence adapters (navigate → screenshot → generate)
- [ ] Orchestrator handles partial failures gracefully

### **WebSocket Broadcasting**
- [ ] Adapters call `broadcaster.broadcast()` on success
- [ ] Adapters call `broadcaster.broadcast()` on error
- [ ] WS events include type, adapter, data/code, timestamp
- [ ] UI can receive and render adapter events without errors

### **Runtime Integration**
- [ ] Agent runtime can call adapters and receive envelopes
- [ ] Agent runtime can log adapter responses to structured logs
- [ ] Agent runtime can persist adapter results to database (if applicable)

---

## Code Quality

### **TypeScript**
- [ ] No `any` types (except when unavoidable for third-party libs)
- [ ] All adapters are typed with `async run(...): Promise<AdapterResponse<T>>`
- [ ] All guard functions have explicit return types
- [ ] No unused imports or variables
- [ ] No type errors on strict mode (`tsconfig.json` strict: true)

### **Style & Consistency**
- [ ] Adapter structure matches pattern (try/catch → parse → guards → success/error)
- [ ] Error codes follow naming convention (UPPERCASE_WITH_UNDERSCORES)
- [ ] Guard function names follow pattern (validate*, sanitize*, detect*)
- [ ] All adapters use same envelope helpers (no custom wrappers)

### **Comments & Documentation**
- [ ] Adapters have JSDoc comments explaining error codes (optional, not required)
- [ ] Guard functions have inline comments for non-obvious logic
- [ ] No excessive commenting (code should be self-documenting)

### **No Regressions**
- [ ] Existing API endpoint tests still pass (if any)
- [ ] Existing adapter tests still pass (before Phase 27.3 changes)
- [ ] No breaking changes to adapter interfaces
- [ ] Backward compatibility verified (if applicable)

---

## Security

### **Input Validation**
- [ ] All external data (Puppeteer output, Anthropic API response) validated
- [ ] No trust of raw output from third-party libraries
- [ ] Size limits enforced (PNG 5MB, text 10KB, etc.)
- [ ] Malformed data rejected with clear error code

### **Sanitization**
- [ ] Control characters removed before passing to downstream consumers
- [ ] ANSI codes stripped (XSS-like prevention)
- [ ] No HTML injection risks in text fields
- [ ] No shell injection risks in error details

### **Error Messages**
- [ ] Error messages don't leak sensitive info (API keys, file paths, etc.)
- [ ] Error details in response are safe to log
- [ ] No stack traces in production error responses (optional)

---

## Documentation

### **Artifacts Provided**
- [ ] `TIER2_AGENTS_CONFLICT_MAP.md` locked (reference, don't edit)
- [ ] `ENTRY_POINT_RUNBOOK.md` locked (reference, don't edit)
- [ ] Adapter diff patches provided (reference for implementation)
- [ ] Error codes documented in this checklist (or separate doc)

### **Code Documentation**
- [ ] Each adapter has brief header comment explaining its role
- [ ] Guard helpers have function-level comments
- [ ] Error codes documented in README or inline comment block

---

## Performance

### **No Significant Overhead**
- [ ] Validation adds <10ms per adapter call (measured)
- [ ] Sanitization adds <5ms for typical strings (measured)
- [ ] Zod schema parsing is fast (benchmarked vs alternatives)
- [ ] No unnecessary memory allocations in hot paths

### **Benchmarks (Optional)**
- [ ] `validateFinalUrl`: 10k calls in <10ms ✓
- [ ] `sanitizeText`: 100k char string in <100ms ✓
- [ ] `validateJsonCompleteness`: 10k calls in <50ms ✓

---

## Merge Gate (Final Checklist)

Before clicking "Merge":

- [ ] All reviewer checks green
- [ ] All tests passing (npm test)
- [ ] TypeScript strict mode clean
- [ ] No console logs, debugger statements
- [ ] Commit messages clear and descriptive
- [ ] PR description summarizes changes
- [ ] No merge conflicts
- [ ] Base branch (master) is stable (CI passing)
- [ ] At least one approval from team lead

---

## Rollback Plan (If Issues Found)

If merged and issues arise:

1. Identify which adapter is failing
2. Check error code returned
3. Revert commit if critical: `git revert <commit-hash>`
4. Create follow-up branch to fix (don't push straight to master)
5. Notify team in Slack/Discord

---

## Post-Merge

### **Deployment**
- [ ] Monitor adapter response times in Prometheus
- [ ] Monitor error rates by adapter (dashboard)
- [ ] Confirm WS broadcasts reach UI (check browser console)

### **Follow-Up**
- [ ] If all green for 24 hours, consider stable
- [ ] Schedule follow-up for Phase 28 (Orchestrator Determinism)
- [ ] Gather feedback from team on validation accuracy

---

## Notes for Reviewer

**Expected code volume:**
- 5 adapter modifications: ~50 lines each = 250 LOC
- 2 helper modules (envelope + guards): ~50 lines each = 100 LOC
- 3 test files: ~450 LOC
- **Total: ~600 LOC**

**Expected test execution time:**
- `npm test` for Phase 27.3: <30 seconds (on modern hardware)
- Integration tests: <10 seconds

**If you have questions:**
- Consult `phase27-3_IMPLEMENTATION_SWEEP.md` for diff examples
- Reference error codes in `validation/guards.ts` comments
- Check integration tests for expected behavior patterns

---

**This checklist is exhaustive by design. If all boxes are green, the PR is ready to merge.**

