// src/tests/feedback-loop.test.ts
// semver: 0.1.0
// date: 2026-06-29

import fs from "fs";
import path from "path";
import { queue } from "../../cic-ingestion/src/ingestion/queue/index.js";
import { resolveJob } from "../../harvester-bridge/resolver.js";
import { clientSessionExtractor } from "../../cic-ingestion/src/extractors/clientSessionExtractor.js";
import { processClientSession } from "../../cic-ingestion/src/harness/replayHarness.js";
import { route } from "../maal/router/maal-routing-policy.js";
import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";

describe("Drift Ingestion Feedback Loop", () => {
  const testLogsDir = path.resolve(process.cwd(), "cic-ingestion", "logs");
  const testLogsFile = path.join(testLogsDir, "client_sessions.jsonl");

  beforeAll(() => {
    // Ensure logs directory exists
    if (!fs.existsSync(testLogsDir)) {
      fs.mkdirSync(testLogsDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testLogsFile)) {
      fs.unlinkSync(testLogsFile);
    }
  });

  test("should execute end-to-end feedback loop and change MAAL routing", async () => {
    // 1. Write mock JSONL log entries
    const entries = [
      // Entry 1: Healthy run (ollama)
      {
        type: "chat_turn",
        timestamp: Date.now() - 5000,
        backend: "ollama",
        request: { model: "llama3" },
        response: {
          usage: { total_tokens: 200 },
          meta: { latency_ms: 400, offline: true },
        },
      },
      // Entry 2: High latency and tokens (ollama) -> Drifted
      {
        type: "chat_turn",
        timestamp: Date.now(),
        backend: "ollama",
        request: { model: "llama3" },
        response: {
          usage: { total_tokens: 3500 }, // > 3000 -> +0.3 drift
          meta: { latency_ms: 1800, offline: true }, // > 1500 -> +0.3 drift
        },
      },
    ];

    const jsonlContent = entries.map(e => JSON.stringify(e)).join("\n");
    fs.writeFileSync(testLogsFile, jsonlContent, "utf8");

    // 2. Queue the ingestion job
    queue.clear();
    queue.enqueue({
      type: "client_session",
      payload: { path: "cic-ingestion/logs/client_sessions.jsonl" },
    });

    // 3. Dequeue and resolve job to raw logs
    const job = queue.dequeue();
    expect(job).toBeDefined();
    const resolvedLines = resolveJob(job!);
    expect(resolvedLines.length).toBe(2);

    // 4. Run extractor on resolved entries
    const extractedEvents = await Promise.all(
      resolvedLines.map(line => clientSessionExtractor(line as any))
    );

    expect(extractedEvents[0].driftSignals.latency).toBe(400);
    expect(extractedEvents[1].driftSignals.latency).toBe(1800);

    // 5. Ingest into cicState via replayHarness
    const cicState = {
      drift: {
        ollama: 0,
        localai: 0,
        gpt4all: 0,
        llamafile: 0,
        koboldcpp: 0,
        anythingllm: 0,
        mock: 0,
      },
    };

    for (const event of extractedEvents) {
      processClientSession(event, cicState);
    }

    // Verify drift score updated (0 + 0 + 0.3 + 0.3 = 0.6)
    expect(cicState.drift.ollama).toBeCloseTo(0.6);

    // Now send another bad run to exceed the threshold (DRIFT_THRESHOLD = 0.7)
    // Latency 2000ms -> +0.3 drift -> total 0.9 (exceeds 0.7)
    const extraEvent = await clientSessionExtractor({
      type: "chat_turn",
      timestamp: Date.now(),
      backend: "ollama",
      request: {},
      response: {
        usage: { total_tokens: 100 },
        meta: { latency_ms: 2000 },
      },
    } as any);

    processClientSession(extraEvent, cicState);
    expect(cicState.drift.ollama).toBeCloseTo(0.9);

    // 6. Verify MAAL routing avoids ollama due to high drift score
    const routeRequest: UnifiedChatRequest = {}; // Request with default fallback
    const selectedBackend = route(routeRequest, cicState);

    // Since ollama's drift is 0.9 (> 0.7), MAAL routing must prune/avoid it
    // and fallback to the next candidate (localai)
    expect(selectedBackend).not.toBe("ollama");
    expect(selectedBackend).toBe("localai");
  });
});
