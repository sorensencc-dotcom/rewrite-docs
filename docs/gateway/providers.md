---
title: providers
---

# Backend Providers

The CIC Routing engine supports a series of local backend LLM configurations to run fully offline, ensuring data isolation and privacy.

---

## 🐋 1. Ollama Provider

Ollama serves as the primary local inference model runner.
* **Default Port:** `11434`
* **Default Models:** `llama3`, `mistral`, `nemotron`
* **Health Endpoint:** `GET http://localhost:11434/api/tags`
* **Fallback Behavior:** If Ollama becomes unreachable or response latency exceeds `1500ms`, the router flags a latency SLA violation and shifts traffic to the next healthiest provider.

---

## ⚡ 2. Llamafile Provider

Llamafile compiles LLM models into single-file executables that execute locally.
* **Default Port:** `8080`
* **Inference Endpoint:** `POST http://localhost:8080/v1/chat/completions`
* **Drift Profile:** Llamafile models maintain low semantic variance, making them ideal targets for deterministic agent tasks.

---

## 🧪 3. Mock Provider

The Mock Provider is a high-availability simulation backend used for unit testing, integration verification, and emergency failover scenarios.
* **Latency:** Simulates typical inference calls with configurable delay matrices.
* **Drift:** Maintains a static `0.0` drift profile, acting as a fallback when all other providers are experiencing performance degradation.
