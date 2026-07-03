// server.js - CodeFlow HTTP API wrapper for CIC integration
import express from "express";
import { analyzeRepo } from "./codeflow-analyze.js";
import { createObserver } from "./codeflow-observability.js";
import path from "path";

const app = express();
const observer = createObserver();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Metrics endpoint
app.get("/metrics", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    analyzer: observer.getMetrics()
  });
});

// Main analysis endpoint
app.post("/analyze", async (req, res) => {
  const { repoPath } = req.body;

  if (!repoPath) {
    return res.status(400).json({
      error: "repoPath required",
      example: { repoPath: "/mnt/repos/myrepo" }
    });
  }

  try {
    const startTime = Date.now();
    const result = await analyzeRepo(repoPath);
    const duration = Date.now() - startTime;

    const log = observer.recordAnalysis(result, duration);
    observer.logStructured(log);

    res.json({
      success: true,
      result,
      metadata: {
        duration_ms: duration,
        files_analyzed: result.files.length,
        edges_found: result.edges.length,
        security_findings: result.security.length,
        patterns_detected: result.patterns.length,
        blast_radius_entries: result.blastRadius.length
      }
    });
  } catch (e) {
    const log = observer.recordError(e, repoPath);
    observer.logStructured(log);
    res.status(500).json({
      error: "analysis failed",
      message: e instanceof Error ? e.message : String(e)
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`CodeFlow analyzer API listening on port ${PORT}`);
  console.log(`Health check: GET /health`);
  console.log(`Analysis: POST /analyze { repoPath: "..." }`);
});
