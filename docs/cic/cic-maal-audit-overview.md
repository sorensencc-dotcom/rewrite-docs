---
title: "Cic Maal Audit Overview"
summary: "# CIC/MAAL Routing & Drift Feedback Loop Audit Guide"
created: "2026-07-03T19:43:45.343Z"
updated: "2026-07-03T19:43:45.343Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC/MAAL Routing & Drift Feedback Loop Audit Guide

This document provides a comprehensive overview of all architectural changes, files created, files modified, and test suites implemented in this session. You can copy this document directly for validation by other agents or CI/CD pipelines.

---

## 🗺️ System Architecture

Below is the execution flow of the offline-first feedback loop:

```
[Inference Gateway] --(Logs Chat Turns)--> [client_sessions.jsonl]
       |                                           |
       |                                           v
[MAAL Routing Policy] <--[cicState.drift]-- [Replay Harness]
       &                                           ^
       |                                           |
(Fallback Decisions)                        [Drift Engine]
       |                                           ^
       |                                           |
 [Offline Runtimes]                       [Session Extractor]
(Ollama, Llamafile...)                             ^
       |                                           |
       +--------------(Parsed Logs)-------- [Bridge Resolver]
```

---

## 📁 Files Created

All paths are absolute and point directly to their workspace locations:

### 1. Model Specifications (JSON Specifications)
Authoritative specification files indicating base URLs, API keys, and model capability matrices:
*   `llamafile.json`
*   `koboldcpp.json`
*   `gpt4all.json`
*   `localai.json`
*   `ollama.json`
*   `anythingllm.json`

### 2. Provider Wrappers (Fetch-based with 30s timeouts)
Clean API adapters with `AbortController` timeouts and robust fallback stubs:
*   `llamafileProvider.ts`
*   `koboldcppProvider.ts`
*   `ollamaProvider.ts`
*   `localaiProvider.ts`
*   `gpt4allProvider.ts`
*   `anythingllmProvider.ts`

### 3. Ingestion & Drift Feedback Loop
Ingestion pipeline modules parsing logs, extracting drift signals, and updating routing states:
*   `clientSessionExtractor.ts`
*   `harvester/index.ts`
*   `ingestion/ingestionRouter.ts`
*   `resolver.ts`
*   `driftEngine.ts`
*   `replayHarness.ts`

### 4. Operator Console UI
*   `dashboard.html` (Root) & `dashboard.html` (Sync Copy) — Frosted-glass dark mode dashboard.

### 5. Test Suites
*   `maal-routing-policy.test.ts` — Tests 11 routing conditions.
*   `feedback-loop.test.ts` — Integration test verifying log-to-drift-feedback.
*   `dashboard-endpoints.test.ts` — Tests `/metrics` and `/dashboard` HTTP codes.

---

## 📝 Files Modified

*   `package.json`: Added `"start:adapter-gateway"` script.
*   `maal-router-types.ts`: Added ESM imports and exports for `UnifiedChatRequest` and `UnifiedChatResponse`.
*   `sandbox-violation.ts`: Fixed incorrect import paths to `postgres-client`.
*   `canary-abort.ts`: Made `triggerCanaryAbort` robust to both single-argument object calls and dual-argument string calls.
*   `jest.config.js`: Ignored obsolete `cic-ingestion/tests/` directory to prevent false-negative test runs in CI.

---

## 🛠️ Verification & Validation Plan

Use these commands to validate the changes:

### 1. Automated Tests Run
To execute all newly added test suites:
```bash
npx jest src/tests/maal-routing-policy.test.ts src/tests/feedback-loop.test.ts src/tests/dashboard-endpoints.test.ts
```
Expected result: **All 16 tests passing cleanly** in under 10 seconds.

### 2. Launch Gateway Server
```bash
npm run start:adapter-gateway
```
Exposes the gateway at port `3119`. You can verify endpoints using:
*   `GET http://localhost:3119/v1/health`
*   `GET http://localhost:3119/v1/models`
*   `GET http://localhost:3119/dashboard`

---

## 🔍 Core Logic Reference

### MAAL Routing Heuristic Table
MAAL selects the model using the following prioritized rule sequence:
1.  `offline_required` $\rightarrow$ `["ollama", "localai", "gpt4all", "llamafile", "mock"]`
2.  `cost_ceiling === 0` $\rightarrow$ `["ollama", "gpt4all", "koboldcpp", "llamafile", "mock"]`
3.  `latency_ms < 1000` $\rightarrow$ `["ollama", "localai", "mock"]`
4.  `min_context_length > 8000` $\rightarrow$ `["koboldcpp", "ollama"]`
5.  `tools.type === "rag"` $\rightarrow$ `["anythingllm", "ollama", "mock"]`
6.  `tags.includes("deterministic-replay")` $\rightarrow$ `["llamafile", "mock"]`
7.  `tags.includes("sandbox")` $\rightarrow$ `["ollama", "llamafile", "mock"]`
8.  `context.source === "lm-studio"` $\rightarrow$ `["ollama", "mock"]` (also maps Jan, Msty, Open WebUI)
9.  `driftScore > 0.7` $\rightarrow$ Backend is pruned and bypassed.

### Drift Score Penalty
Drift accumulates as:
$$\text{Penalty} = \begin{cases} 0.3 & \text{if Latency} > 1500\text{ ms} \\ 0.0 & \text{otherwise} \end{cases} + \begin{cases} 0.3 & \text{if Tokens} > 3000 \\ 0.0 & \text{otherwise} \end{cases}$$
$$\text{driftState}[\text{backend}] = \min(1.0, \text{driftState}[\text{backend}] + \text{Penalty})$$
