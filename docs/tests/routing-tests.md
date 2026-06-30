---
title: routing tests
---

# Routing Test Matrix

The Routing Test Suite validates local-first constraints, fallback mechanics, and drift routing rules.

---

## 🧪 1. Local-First Gating Tests

* **Case 1: Local Backend Constraint**
  * **Input:** `localFirst: true`, request payload.
  * **Expected:** Selected backend must reside in `[ollama, localai, gpt4all, llamafile, koboldcpp, anythingllm, mock]`. Cloud endpoints must not receive traffic.
  
* **Case 2: Cloud Fallback Bypass**
  * **Input:** Local backends unreachable, `localFirst: true`.
  * **Expected:** Bypasses external cloud routing entirely, throwing a structured `ERR_LOCAL_BACKEND_UNAVAILABLE` error instead of escalating to SaaS.

---

## 🛡️ 2. Drift-Based Failover Tests

* **Case 3: High Drift Exclusion**
  * **Input:** `ollama` drift = `0.9`, `mock` drift = `0.1`.
  * **Expected:** Traffic is dynamically routed to the `mock` provider despite `ollama` being preferred in the regime config.

* **Case 4: Routing Freeze Enforcement**
  * **Input:** `routingFrozen: true` in state store.
  * **Expected:** Router bypasses the entire policy tree and directs all incoming requests to the designated `frozenBackend`.
