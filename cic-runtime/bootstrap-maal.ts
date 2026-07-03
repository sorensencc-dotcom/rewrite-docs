/**
 * Bootstrap: CIC MAAL Test Server
 * Minimal HTTP server for MAAL endpoint testing
 * Test mode: uses mock responses (no API keys required)
 */

import express from "express";
import pino from "pino";

const app = express();
const port = process.env.PORT || 3000;
let testMode = !process.env.ANTHROPIC_API_KEY;

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true
    }
  }
});

app.use(express.json());

// Mock agent responses for testing (no API keys needed)
const mockAgents = {
  enrich: (content: string) => {
    return `Enriched: ${content} | Semantic tags: [analysis, summary] | Model: claude-3.7`;
  },
  orchestrate: (plan: string) => {
    return `Orchestrated: ${plan} | Tasks: [parse, analyze, execute] | Model: fugu-ultra`;
  },
  synthesize: (chunks: string[]) => {
    return `Synthesized: ${chunks.join(" → ")} | Output format: markdown | Model: gpt-4.1`;
  },
  audit: (result: string) => {
    return {
      primaryModel: "claude-3.7",
      secondaryModel: "fugu-ultra",
      score: 0.87,
      issues: [],
      consistency: "high"
    };
  }
};

// Real agents (if API keys available)
let realAgents: any = null;
let realAgentsLoaded = false;
if (!testMode) {
  try {
    const { EnrichmentAgent } = await import("../src/agents/enrichmentAgent.js");
    const { OrchestratorAgent } = await import("../src/agents/orchestratorAgent.js");
    const { SynthesisAgent } = await import("../src/agents/synthesisAgent.js");
    const { AuditAgent } = await import("../src/agents/auditAgent.js");
    realAgents = {
      enrichmentAgent: new EnrichmentAgent(),
      orchestratorAgent: new OrchestratorAgent(),
      synthesisAgent: new SynthesisAgent(),
      auditAgent: new AuditAgent()
    };
    realAgentsLoaded = true;
  } catch (e) {
    logger.error(e, "Failed to load real agents; reverting to mock mode");
    testMode = true;
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Enrichment endpoint
app.post("/enrich", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Missing content" });
    }

    const result = testMode
      ? mockAgents.enrich(content)
      : await realAgents.enrichmentAgent.enrich(content);

    res.json({
      status: "ok",
      enriched: result,
      mode: testMode ? "mock" : "live"
    });
  } catch (error: any) {
    logger.error(error, "Enrichment failed");
    res.status(500).json({ error: error.message });
  }
});

// Orchestration endpoint
app.post("/orchestrate", async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) {
      return res.status(400).json({ error: "Missing plan" });
    }

    const result = testMode
      ? mockAgents.orchestrate(plan)
      : await realAgents.orchestratorAgent.runPlan(plan);

    res.json({
      status: "ok",
      orchestrated: result,
      mode: testMode ? "mock" : "live"
    });
  } catch (error: any) {
    logger.error(error, "Orchestration failed");
    res.status(500).json({ error: error.message });
  }
});

// Synthesis endpoint
app.post("/synthesize", async (req, res) => {
  try {
    const { chunks } = req.body;
    if (!Array.isArray(chunks)) {
      return res.status(400).json({ error: "Missing or invalid chunks" });
    }

    const result = testMode
      ? mockAgents.synthesize(chunks)
      : await realAgents.synthesisAgent.synthesize(chunks);

    res.json({
      status: "ok",
      synthesized: result,
      mode: testMode ? "mock" : "live"
    });
  } catch (error: any) {
    logger.error(error, "Synthesis failed");
    res.status(500).json({ error: error.message });
  }
});

// Audit endpoint
app.post("/audit", async (req, res) => {
  try {
    const { result } = req.body;
    if (!result) {
      return res.status(400).json({ error: "Missing result" });
    }

    const auditResult = testMode
      ? mockAgents.audit(result)
      : await realAgents.auditAgent.audit(result);

    res.json({
      status: "ok",
      audit: auditResult,
      mode: testMode ? "mock" : "live"
    });
  } catch (error: any) {
    logger.error(error, "Audit failed");
    res.status(500).json({ error: error.message });
  }
});

// Full pipeline endpoint
app.post("/pipeline/full", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Missing content" });
    }

    logger.info("Starting full pipeline");

    // Stage 1: Enrich
    const enriched = testMode
      ? mockAgents.enrich(content)
      : await realAgents.enrichmentAgent.enrich(content);
    logger.info("Enrichment complete");

    // Stage 2: Orchestrate
    const orchestrated = testMode
      ? mockAgents.orchestrate(enriched)
      : await realAgents.orchestratorAgent.runPlan(enriched);
    logger.info("Orchestration complete");

    // Stage 3: Synthesize
    const synthesized = testMode
      ? mockAgents.synthesize([orchestrated])
      : await realAgents.synthesisAgent.synthesize([orchestrated]);
    logger.info("Synthesis complete");

    // Stage 4: Audit
    const auditResult = testMode
      ? mockAgents.audit(synthesized)
      : await realAgents.auditAgent.audit(synthesized);
    logger.info("Audit complete", { score: auditResult.score || 0.87 });

    res.json({
      status: "ok",
      pipeline: {
        enriched,
        orchestrated,
        synthesized,
        audit: auditResult
      },
      mode: testMode ? "mock" : "live"
    });
  } catch (error: any) {
    logger.error(error, "Full pipeline failed");
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  logger.info(`CIC MAAL Bootstrap running on http://localhost:${port}`);
  logger.info(`Mode: ${testMode ? "TEST (mock responses)" : "LIVE (real API calls)"}`);
  logger.info("Endpoints: /health, /enrich, /orchestrate, /synthesize, /audit, /pipeline/full");
});

// Graceful shutdown
const signals = ["SIGTERM", "SIGINT"];
for (const signal of signals) {
  process.on(signal, () => {
    logger.info(`Received ${signal}, shutting down`);
    process.exit(0);
  });
}
