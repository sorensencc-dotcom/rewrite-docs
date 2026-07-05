/*
  filename: c07-local-first-e2e.test.ts
  purpose: E2E Integration test suite for Local-First mode (Routing, Ingestion, Auditing)
  version: 1.0.0
*/
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { routeLocalFirst } from "../../../routing/local-first-router.js";
import { isLocalFirstEnabled } from "../../../runtime/config/runtime-config.js";
import { orchestrateMultiPipeline } from "../../../ingestion/multi-pipeline-orchestrator.js";
import { emitTrace, loadTrace } from "../../../ingestion/trace-emitter.js";
import { emitConsoleView, loadConsoleView, generateReport } from "../../../ingestion/operator-console-view.js";
import { LocalFirstBus } from "../../../messaging/local-first-bus.js";
import { unifiedIngestionAdapter } from "../../../ingestion/unified-ingestion-adapter.js";
describe("Local-First E2E Integration Workflow", () => {
    const tempTestDir = path.join(process.cwd(), "temp-e2e-test-data");
    const docPath1 = path.join(tempTestDir, "test-doc-1.txt");
    const docPath2 = path.join(tempTestDir, "test-doc-2.txt");
    const runId = `e2e-run-${Date.now()}`;
    // Backups
    const worldStatePath = "snapshot/world/world-state.json";
    const trainingAssetsPath = "data/training-assets.json";
    const rewriteLabsAssetsPath = "data/rewrite-labs-assets.json";
    let worldStateBackup = null;
    let trainingAssetsBackup = null;
    let rewriteLabsAssetsBackup = null;
    beforeAll(() => {
        // 1. Create temp directory and files
        if (!fs.existsSync(tempTestDir)) {
            fs.mkdirSync(tempTestDir, { recursive: true });
        }
        fs.writeFileSync(docPath1, "Hello from local-first E2E document 1 content!");
        fs.writeFileSync(docPath2, "Another E2E test content for document 2.");
        // 2. Backup existing state
        if (fs.existsSync(worldStatePath)) {
            worldStateBackup = fs.readFileSync(worldStatePath, "utf8");
        }
        if (fs.existsSync(trainingAssetsPath)) {
            trainingAssetsBackup = fs.readFileSync(trainingAssetsPath, "utf8");
        }
        if (fs.existsSync(rewriteLabsAssetsPath)) {
            rewriteLabsAssetsBackup = fs.readFileSync(rewriteLabsAssetsPath, "utf8");
        }
    });
    afterAll(() => {
        // 1. Clean up temp files
        if (fs.existsSync(tempTestDir)) {
            fs.rmSync(tempTestDir, { recursive: true, force: true });
        }
        // 2. Restore backups
        if (worldStateBackup !== null) {
            fs.writeFileSync(worldStatePath, worldStateBackup);
        }
        if (trainingAssetsBackup !== null) {
            fs.writeFileSync(trainingAssetsPath, trainingAssetsBackup);
        }
        else {
            fs.rmSync(trainingAssetsPath, { force: true });
        }
        if (rewriteLabsAssetsBackup !== null) {
            fs.writeFileSync(rewriteLabsAssetsPath, rewriteLabsAssetsBackup);
        }
        else {
            fs.rmSync(rewriteLabsAssetsPath, { force: true });
        }
        // 3. Clean up run specific logs
        fs.rmSync(path.join("audit/runs", `${runId}.json`), { force: true });
        fs.rmSync(path.join("data/console", `${runId}-console.json`), { force: true });
    });
    it("Step 1: Routing — Enforces local backends when localFirst is enabled", () => {
        const request = {
            messages: [{ role: "user", content: "hello routing test" }]
        };
        const cic = {
            drift: {
                ollama: 0,
                localai: 0,
                gpt4all: 0,
                llamafile: 0,
                koboldcpp: 0,
                anythingllm: 0,
                mock: 0
            }
        };
        const isEnabled = isLocalFirstEnabled();
        expect(isEnabled).toBe(true);
        const routePlan = routeLocalFirst(request, cic);
        expect(routePlan.localFirst).toBe(true);
        expect(["ollama", "localai", "gpt4all", "llamafile", "koboldcpp", "anythingllm", "mock"]).toContain(routePlan.backend);
        // Verify drift protection hard fallback
        const highDriftCic = {
            drift: {
                ollama: 0.9,
                localai: 0.9,
                gpt4all: 0.9,
                llamafile: 0.9,
                koboldcpp: 0.9,
                anythingllm: 0.9,
                mock: 0.1 // Lowest drift amongst candidates
            }
        };
        const routePlanDrift = routeLocalFirst(request, highDriftCic);
        expect(routePlanDrift.localFirst).toBe(true);
        expect(routePlanDrift.backend).toBe("mock");
    });
    it("Step 2: Ingestion — Normalizes assets and fans out to 4 pipelines", () => {
        const result = orchestrateMultiPipeline({
            docs: [docPath1, docPath2],
            images: []
        });
        expect(result.status).toBe("success");
        expect(result.assetCount).toBe(2);
        expect(result.finalSealHash.length).toBe(64);
        expect(result.pipelines.corpus.status).toBe("success");
        expect(result.pipelines.modelTraining.status).toBe("success");
        expect(result.pipelines.treatment.status).toBe("success");
        expect(result.pipelines.rewriteLabs.status).toBe("success");
        // Check world-state.json modifications
        const worldState = JSON.parse(fs.readFileSync(worldStatePath, "utf8"));
        expect(worldState.localFirst).toBe(true);
        expect(Array.isArray(worldState.ingestedAssets)).toBe(true);
        expect(worldState.ingestedAssets).toContain(result.pipelines.corpus.assetIds[0]);
        // Check training-assets.json modifications
        const trainingAssets = JSON.parse(fs.readFileSync(trainingAssetsPath, "utf8"));
        expect(Array.isArray(trainingAssets)).toBe(true);
        expect(trainingAssets.some((a) => a.id === result.pipelines.corpus.assetIds[0])).toBe(true);
        // Check rewrite-labs-assets.json modifications
        const rewriteAssets = JSON.parse(fs.readFileSync(rewriteLabsAssetsPath, "utf8"));
        expect(Array.isArray(rewriteAssets)).toBe(true);
        expect(rewriteAssets.some((a) => a.id === result.pipelines.corpus.assetIds[0])).toBe(true);
    });
    it("Step 3: Auditing — Emits and loads deterministic traces, dashboard console view, and text reports", () => {
        const orchestrationResult = orchestrateMultiPipeline({
            docs: [docPath1, docPath2],
            images: []
        });
        // Reconstruct the sent messages deterministically to pass to the trace emitter
        const assets = unifiedIngestionAdapter({ docs: [docPath1, docPath2], images: [] });
        const bus = new LocalFirstBus();
        const treatmentMessages = assets.map(asset => bus.send("cic-ingestion", "treatment-pipeline", "evidence_item", {
            assetId: asset.id,
            type: asset.type,
            metadataHash: asset.metadata.hash,
            embeddingHash: crypto
                .createHash("sha256")
                .update(JSON.stringify(asset.embedding))
                .digest("hex")
        }));
        const messagesByType = {
            treatment: treatmentMessages
        };
        // Emit Trace
        const trace = emitTrace(orchestrationResult, { docs: [docPath1, docPath2], images: [] }, runId, orchestrationResult.assetCount, messagesByType);
        expect(trace.taskId).toBe(runId);
        expect(trace.localFirst).toBe(true);
        expect(trace.result.finalSealHash).toBe(orchestrationResult.finalSealHash);
        const traceFile = path.join("audit/runs", `${runId}.json`);
        expect(fs.existsSync(traceFile)).toBe(true);
        // Load Trace
        const loadedTrace = loadTrace(runId);
        expect(loadedTrace).not.toBeNull();
        expect(loadedTrace?.taskId).toBe(runId);
        // Emit Console View
        const consoleView = emitConsoleView(trace, runId);
        expect(consoleView.runId).toBe(runId);
        expect(consoleView.mode).toBe("local-first");
        expect(consoleView.pipelines).toHaveLength(4);
        const consoleFile = path.join("data/console", `${runId}-console.json`);
        expect(fs.existsSync(consoleFile)).toBe(true);
        // Load Console View
        const loadedView = loadConsoleView(runId);
        expect(loadedView).not.toBeNull();
        expect(loadedView?.runId).toBe(runId);
        // Generate Human-Readable Report
        const report = generateReport(consoleView);
        expect(report).toContain("=== Operator Console Report ===");
        expect(report).toContain(runId);
        expect(report).toContain("Mode: local-first");
    });
    it("Step 4: TorqueQuery Introspection — Verifies local-first mode assertions", () => {
        // Read the query pack
        const queryPack = JSON.parse(fs.readFileSync("snapshot/torque/local-first-queries.json", "utf8"));
        const queries = queryPack.queries;
        expect(queries).toHaveLength(5);
        // Assert q-local-first-enabled
        const qEnabled = queries.find((q) => q.id === "q-local-first-enabled");
        expect(qEnabled).toBeDefined();
        const profile = JSON.parse(fs.readFileSync(qEnabled.plan.read[0], "utf8"));
        expect(profile.localFirstProfile.enabled).toBe(qEnabled.plan.expect);
        // Assert q-local-first-snapshot
        const qSnapshot = queries.find((q) => q.id === "q-local-first-snapshot");
        expect(qSnapshot).toBeDefined();
        const worldState = JSON.parse(fs.readFileSync(qSnapshot.plan.read[0], "utf8"));
        expect(worldState.localFirst).toBe(qSnapshot.plan.expect);
        // Assert q-local-first-certificate
        const qCert = queries.find((q) => q.id === "q-local-first-certificate");
        expect(qCert).toBeDefined();
        const cert = JSON.parse(fs.readFileSync(qCert.plan.read[0], "utf8"));
        expect(cert.cicLocalFirstCertificate.mode).toBe(qCert.plan.expect[0]);
        expect(cert.cicLocalFirstCertificate.deterministic).toBe(qCert.plan.expect[1]);
        expect(cert.cicLocalFirstCertificate.sealed).toBe(qCert.plan.expect[2]);
        expect(cert.cicLocalFirstCertificate.offline).toBe(qCert.plan.expect[3]);
    });
    it("Step 5: Determinism Stability — Iterative runs generate identical hashes and state delta", () => {
        const runsCount = 50;
        const runs = Array.from({ length: runsCount }, () => orchestrateMultiPipeline({
            docs: [docPath1, docPath2],
            images: []
        }));
        const expectedHash = runs[0].finalSealHash;
        expect(expectedHash.length).toBe(64);
        runs.forEach((run) => {
            expect(run.finalSealHash).toBe(expectedHash);
            expect(run.pipelines.corpus.hash).toBe(runs[0].pipelines.corpus.hash);
            expect(run.pipelines.modelTraining.hash).toBe(runs[0].pipelines.modelTraining.hash);
            expect(run.pipelines.treatment.hash).toBe(runs[0].pipelines.treatment.hash);
            expect(run.pipelines.rewriteLabs.hash).toBe(runs[0].pipelines.rewriteLabs.hash);
        });
    });
});
//# sourceMappingURL=c07-local-first-e2e.test.js.map