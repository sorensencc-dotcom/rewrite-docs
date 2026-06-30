// src/server/adapterGatewayAPI.ts
// semver: 0.1.0
// date: 2026-06-29

import express from "express";
import fs from "fs";
import path from "path";

import { route, BackendId } from "../maal/router/maal-routing-policy.js";
import { UnifiedChatRequest, UnifiedChatResponse } from "../types/unifiedChatTypes.js";
import { llamafileChat } from "../providers/llamafileProvider.js";
import { koboldcppChat } from "../providers/koboldcppProvider.js";
import { ollamaChat } from "../providers/ollamaProvider.js";
import { localaiChat } from "../providers/localaiProvider.js";
import { gpt4allChat } from "../providers/gpt4allProvider.js";
import { anythingllmChat } from "../providers/anythingllmProvider.js";
import { resolveJob } from "../../harvester-bridge/resolver.js";
import { clientSessionExtractor } from "../../cic-ingestion/src/extractors/clientSessionExtractor.js";
import { processClientSession } from "../../cic-ingestion/src/harness/replayHarness.js";
import { decayDriftScores } from "../../cic-ingestion/src/drift/driftEngine.js";
import { CICStateStore } from "./cicStateStore.js";

const PORT = Number(process.env.ADAPTER_GATEWAY_PORT || 3119);

const app = express();

// Lightweight CORS Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: "2mb" }));

// Lightweight Logger Middleware
app.use((req, res, next) => {
  // Simple request logging, avoiding console pollution in tests
  if (process.env.NODE_ENV !== "test") {
    console.log(`[adapter-gateway] ${req.method} ${req.path}`);
  }
  next();
});

// Persistent state store for SLA metrics, playbooks, and freeze gates
const stateStore = new CICStateStore();
let cicState = stateStore.load();

// ---------- helpers ----------

function ensureLogsDir(): string {
  const logsDir = path.join(process.cwd(), "cic-ingestion", "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

function appendClientLog(entry: unknown) {
  try {
    const logsDir = ensureLogsDir();
    const file = path.join(logsDir, "client_sessions.jsonl");
    const line = JSON.stringify(entry);
    fs.appendFileSync(file, line + "\n");
  } catch (err: any) {
    console.error("[adapter-gateway] failed to write client log:", err.message);
  }
}

async function mockChat(req: UnifiedChatRequest): Promise<UnifiedChatResponse> {
  const content = req.messages?.[req.messages.length - 1]?.content ?? "";
  const text = `[MOCK:mock] Unified chat response for: ${content}`;
  return {
    id: `mock-${Date.now()}`,
    model: req.model || "mock",
    created: Date.now(),
    usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
    output: {
      text,
      messages: [{ role: "assistant", content: text }],
    },
    meta: {
      backend: "mock",
      latency_ms: 10,
      offline: true,
      source: req.context?.source ?? "direct",
    },
  };
}

async function dispatchToBackend(
  backend: BackendId,
  req: UnifiedChatRequest
): Promise<UnifiedChatResponse> {
  switch (backend) {
    case "llamafile":
      return llamafileChat(req);
    case "koboldcpp":
      return koboldcppChat(req);
    case "ollama":
      return ollamaChat(req);
    case "localai":
      return localaiChat(req);
    case "gpt4all":
      return gpt4allChat(req);
    case "anythingllm":
      return anythingllmChat(req);
    case "mock":
      return mockChat(req);
    default:
      throw new Error(`Unsupported backend: ${backend}`);
  }
}

// ---------- core unified endpoints ----------

// POST /v1/chat
app.post("/v1/chat", async (req, res) => {
  const unifiedReq: UnifiedChatRequest = {
    model: req.body.model,
    messages: req.body.messages,
    input: req.body.input,
    context: req.body.context ?? {
      source: "direct",
      session_id: req.body.session_id,
      user_id: req.body.user_id,
      tags: req.body.tags ?? [],
    },
    routing: req.body.routing ?? { slo: {} },
    tools: req.body.tools ?? [],
  };

  try {
    const backend = cicState.routingFrozen && cicState.frozenBackend
      ? cicState.frozenBackend
      : route(unifiedReq, cicState);
    const response = await dispatchToBackend(backend, unifiedReq);

    // log for CIC ingestion (offline-first)
    appendClientLog({
      type: "client_session",
      event_type: "chat_turn",
      timestamp: Date.now(),
      backend,
      request: unifiedReq,
      response,
    });

    res.json(response);
  } catch (err: any) {
    console.error("[adapter-gateway] /v1/chat error:", err.message);
    res.status(500).json({ error: "adapter_gateway_chat_error" });
  }
});

// POST /v1/completion (simple text completion)
app.post("/v1/completion", async (req, res) => {
  const unifiedReq: UnifiedChatRequest = {
    model: req.body.model,
    input: req.body.prompt,
    messages: [
      {
        role: "user",
        content: req.body.prompt ?? "",
      },
    ],
    context: req.body.context ?? {
      source: "direct",
      session_id: req.body.session_id,
      user_id: req.body.user_id,
      tags: req.body.tags ?? [],
    },
    routing: req.body.routing ?? { slo: {} },
    tools: [],
  };

  try {
    const backend = cicState.routingFrozen && cicState.frozenBackend
      ? cicState.frozenBackend
      : route(unifiedReq, cicState);
    const response = await dispatchToBackend(backend, unifiedReq);

    appendClientLog({
      type: "client_session",
      event_type: "completion_turn",
      timestamp: Date.now(),
      backend,
      request: unifiedReq,
      response,
    });

    res.json(response);
  } catch (err: any) {
    console.error("[adapter-gateway] /v1/completion error:", err.message);
    res.status(500).json({ error: "adapter_gateway_completion_error" });
  }
});

// POST /v1/embed
app.post("/v1/embed", async (req, res) => {
  res.status(501).json({ error: "embed_not_implemented_yet" });
});

// POST /v1/rag/query (AnythingLLM)
app.post("/v1/rag/query", async (req, res) => {
  const unifiedReq: UnifiedChatRequest = {
    model: req.body.model ?? "rag",
    input: req.body.query,
    messages: [
      {
        role: "user",
        content: req.body.query ?? "",
      },
    ],
    context: req.body.context ?? {
      source: "direct",
      session_id: req.body.session_id,
      user_id: req.body.user_id,
      tags: ["rag"],
    },
    routing: req.body.routing ?? { slo: {} },
    tools: [{ name: "rag", type: "rag", args: req.body.args ?? {} }],
  };

  try {
    const backend: BackendId = "anythingllm";
    const response = await dispatchToBackend(backend, unifiedReq);

    appendClientLog({
      type: "client_session",
      event_type: "rag_turn",
      timestamp: Date.now(),
      backend,
      request: unifiedReq,
      response,
    });

    res.json(response);
  } catch (err: any) {
    console.error("[adapter-gateway] /v1/rag/query error:", err.message);
    res.status(500).json({ error: "adapter_gateway_rag_error" });
  }
});

// GET /v1/models
app.get("/v1/models", (_req, res) => {
  const models = [
    { id: "ollama", provider: "ollama" },
    { id: "localai", provider: "localai" },
    { id: "gpt4all", provider: "gpt4all" },
    { id: "llamafile", provider: "llamafile" },
    { id: "koboldcpp", provider: "koboldcpp" },
    { id: "anythingllm", provider: "anythingllm" },
    { id: "mock", provider: "mock" },
  ];
  res.json({ data: models });
});

// GET /v1/health
app.get("/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    port: PORT,
    backends: ["ollama", "localai", "gpt4all", "llamafile", "koboldcpp", "anythingllm", "mock"],
  });
});

// ---------- client routes (UX front-ends) ----------

// POST /client/send
app.post("/client/send", async (req, res) => {
  const unifiedReq: UnifiedChatRequest = {
    model: req.body.model,
    messages: req.body.messages,
    input: req.body.input,
    context: {
      source: req.body.source ?? "direct",
      session_id: req.body.session_id,
      user_id: req.body.user_id,
      tags: req.body.tags ?? [],
    },
    routing: req.body.routing ?? { slo: {} },
    tools: req.body.tools ?? [],
  };

  try {
    const backend = cicState.routingFrozen && cicState.frozenBackend
      ? cicState.frozenBackend
      : route(unifiedReq, cicState);
    const response = await dispatchToBackend(backend, unifiedReq);

    appendClientLog({
      type: "client_session",
      event_type: "client_send",
      timestamp: Date.now(),
      backend,
      request: unifiedReq,
      response,
    });

    res.json(response);
  } catch (err: any) {
    console.error("[adapter-gateway] /client/send error:", err.message);
    res.status(500).json({ error: "adapter_gateway_client_send_error" });
  }
});

// POST /client/session
app.post("/client/session", (req, res) => {
  appendClientLog({
    type: "client_session",
    event_type: "session_created",
    timestamp: Date.now(),
    session: req.body,
  });
  res.json({ status: "ok" });
});

// POST /client/logs
app.post("/client/logs", (req, res) => {
  appendClientLog({
    type: "client_session",
    event_type: "client_logs",
    timestamp: Date.now(),
    payload: req.body,
  });
  res.json({ status: "ok" });
});

// GET /metrics
app.get("/metrics", (_req, res) => {
  const logsDir = path.join(process.cwd(), "cic-ingestion", "logs");
  const file = path.join(logsDir, "client_sessions.jsonl");

  let recent = [];
  try {
    if (fs.existsSync(file)) {
      const lines = fs.readFileSync(file, "utf8").trim().split("\n");
      recent = lines.filter(Boolean).slice(-50).map(line => JSON.parse(line));
    }
  } catch (err: any) {
    console.error("[adapter-gateway] /metrics log read error:", err.message);
  }

  res.json({
    drift: cicState.drift,
    slaMetrics: cicState.slaMetrics,
    activePlaybooks: cicState.activePlaybooks,
    violations: cicState.violations,
    routingFrozen: cicState.routingFrozen,
    frozenBackend: cicState.frozenBackend,
    promotionsFrozen: cicState.promotionsFrozen,
    rollbacksFrozen: cicState.rollbacksFrozen,
    governanceLockdown: cicState.governanceLockdown,
    recent,
    timestamp: Date.now(),
  });
});

// GET /dashboard
app.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "dashboard.html"));
});

// POST /admin/reset-drift
app.post("/admin/reset-drift", (req, res) => {
  const { backend } = req.body;
  if (backend && cicState.drift[backend as BackendId] !== undefined) {
    cicState.drift[backend as BackendId] = 0;
  } else {
    for (const k in cicState.drift) cicState.drift[k as BackendId] = 0;
  }
  stateStore.save(cicState);
  res.json({ reset: true, drift: cicState.drift });
});

// POST /admin/playbook/trigger
app.post("/admin/playbook/trigger", (req, res) => {
  const { playbook, active } = req.body;
  if (!playbook || typeof active !== "boolean") {
    return res.status(400).json({ error: "playbook and active required" });
  }
  cicState = stateStore.triggerPlaybook(playbook, active);
  res.json({ playbook, active, activePlaybooks: cicState.activePlaybooks });
});

// GET /admin/playbook/status
app.get("/admin/playbook/status", (_req, res) => {
  res.json({
    activePlaybooks: cicState.activePlaybooks,
    routingFrozen: cicState.routingFrozen,
    governanceLockdown: cicState.governanceLockdown,
  });
});

// ---------- feedback loop ----------

const logsFilePath = path.join(process.cwd(), "cic-ingestion", "logs", "client_sessions.jsonl");
const processedIds = new Set<string>();

async function runFeedbackLoop() {
  try {
    cicState = stateStore.load();
    const entries = resolveJob({ type: "client_session", payload: { path: logsFilePath } });
    decayDriftScores(cicState.drift);
    for (const entry of entries) {
      if (!entry || !entry.backend || !entry.timestamp) continue;
      const key = `${entry.timestamp}-${entry.backend}`;
      if (processedIds.has(key)) continue;
      processedIds.add(key);
      const extracted = await clientSessionExtractor(entry);
      processClientSession(extracted, cicState);
    }
    stateStore.save(cicState);
  } catch (err: any) {
    console.error("[adapter-gateway] feedback loop error:", err.message);
  }
}

setInterval(runFeedbackLoop, 30_000);

// ---------- start server ----------

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[adapter-gateway] listening on port ${PORT}`);
  });
}

export default app;
