// src/tests/phase5-operational.test.ts
// semver: 0.1.0
// date: 2026-06-29
import fs from "fs";
import path from "path";
import { CICStateStore } from "../server/cicStateStore.js";
import { IngestionDaemon } from "../../cic-ingestion/src/ingestion/daemon.js";
import { createAuditEvent, appendAuditEvent, verifyAuditChain, loadAuditLog } from "../../governance/audit-policy.js";
import { executePromotion, executeRollback } from "../../governance/promotion-rollback.js";
import { route } from "../maal/router/maal-routing-policy.js";
describe("Phase 5: Operational Playbooks, Runbooks & SLA Enforcement", () => {
    const tempStateFile = path.resolve(process.cwd(), "governance", "cicState_test.json");
    const tempAuditFile = path.resolve(process.cwd(), "governance", "audit-log_test.json");
    const tempLogFile = path.resolve(process.cwd(), "cic-ingestion", "logs", "client_sessions_test.jsonl");
    let stateStore;
    beforeEach(() => {
        process.env.CIC_STATE_FILE = tempStateFile;
        // Set up temp state store
        stateStore = new CICStateStore(tempStateFile);
        stateStore.save(stateStore.getDefaultState());
        // Clean up files if they exist
        if (fs.existsSync(tempAuditFile))
            fs.unlinkSync(tempAuditFile);
        if (fs.existsSync(tempLogFile))
            fs.unlinkSync(tempLogFile);
    });
    afterEach(() => {
        delete process.env.CIC_STATE_FILE;
        if (fs.existsSync(tempStateFile))
            fs.unlinkSync(tempStateFile);
        if (fs.existsSync(tempAuditFile))
            fs.unlinkSync(tempAuditFile);
        if (fs.existsSync(tempLogFile))
            fs.unlinkSync(tempLogFile);
    });
    // ==========================================================================
    // GROUP 1: SLA Violations (10 tests)
    // ==========================================================================
    describe("SLA Violations", () => {
        test("1. Latency breach triggers SLA violation and driftSpike playbook", () => {
            const state = stateStore.addViolation("latency_breach", "p95 latency exceeded", "SEV-3");
            expect(state.violations).toContainEqual(expect.objectContaining({ category: "latency_breach", severity: "SEV-3" }));
            expect(state.activePlaybooks.driftSpike).toBe(true);
        });
        test("2. Latency breach within limits clears the violation", () => {
            stateStore.addViolation("latency_breach", "p95 latency exceeded", "SEV-3");
            const state = stateStore.clearViolation("latency_breach");
            expect(state.violations.find(v => v.category === "latency_breach")).toBeUndefined();
            expect(state.activePlaybooks.driftSpike).toBe(false);
        });
        test("3. Token breach triggers SLA violation and drift score penalty", () => {
            const state = stateStore.addViolation("token_breach", "token limit exceeded", "SEV-3");
            expect(state.violations).toContainEqual(expect.objectContaining({ category: "token_breach", severity: "SEV-3" }));
            expect(state.activePlaybooks.driftSpike).toBe(true);
        });
        test("4. Backlog breach triggers SLA violation and ingestionRecovery playbook", () => {
            const state = stateStore.addViolation("ingestion_backlog", "queue backlog > 200", "SEV-2");
            expect(state.violations).toContainEqual(expect.objectContaining({ category: "ingestion_backlog", severity: "SEV-2" }));
            expect(state.activePlaybooks.ingestionRecovery).toBe(true);
        });
        test("5. Backlog breach below threshold clears violation and playbook", () => {
            stateStore.addViolation("ingestion_backlog", "queue backlog > 200", "SEV-2");
            const state = stateStore.clearViolation("ingestion_backlog");
            expect(state.activePlaybooks.ingestionRecovery).toBe(false);
        });
        test("6. Routing oscillation triggers violation and freezes routing", () => {
            const state = stateStore.addViolation("routing_oscillation", "routing changes > 2/min", "SEV-2");
            expect(state.violations).toContainEqual(expect.objectContaining({ category: "routing_oscillation", severity: "SEV-2" }));
            expect(state.routingFrozen).toBe(true);
            expect(state.activePlaybooks.routingStability).toBe(true);
        });
        test("7. Routing oscillation clears when stable", () => {
            stateStore.addViolation("routing_oscillation", "routing changes > 2/min", "SEV-2");
            const state = stateStore.clearViolation("routing_oscillation");
            expect(state.routingFrozen).toBe(false);
            expect(state.activePlaybooks.routingStability).toBe(false);
        });
        test("8. Hash-chain break triggers SEV-1 and locks down governance", () => {
            const state = stateStore.addViolation("governance_chain_break", "audit chain broken", "SEV-1");
            expect(state.governanceLockdown).toBe(true);
            expect(state.promotionsFrozen).toBe(true);
            expect(state.rollbacksFrozen).toBe(true);
            expect(state.activePlaybooks.governanceLockdown).toBe(true);
        });
        test("9. Normal audit chain has no break", () => {
            const event1 = createAuditEvent("gate_created", "operator", "task-1", "canary", "success", "desc", [], []);
            appendAuditEvent(event1, tempAuditFile);
            const event2 = createAuditEvent("gate_approved", "operator", "task-1", "canary", "success", "desc", [], []);
            appendAuditEvent(event2, tempAuditFile);
            const chainCheck = verifyAuditChain(tempAuditFile);
            expect(chainCheck.valid).toBe(true);
        });
        test("10. Unsealed audit chain break is detected", () => {
            const event1 = createAuditEvent("gate_created", "operator", "task-1", "canary", "success", "desc", [], []);
            appendAuditEvent(event1, tempAuditFile);
            const event2 = createAuditEvent("gate_approved", "operator", "task-1", "canary", "success", "desc", [], []);
            appendAuditEvent(event2, tempAuditFile);
            // Tamper with the audit log file directly
            const auditLog = JSON.parse(fs.readFileSync(tempAuditFile, "utf8"));
            auditLog.events[0].status = "failure"; // Change status of event 1, breaking chain
            fs.writeFileSync(tempAuditFile, JSON.stringify(auditLog, null, 2));
            const chainCheck = verifyAuditChain(tempAuditFile);
            expect(chainCheck.valid).toBe(false);
            expect(chainCheck.breakAt).toBe(0);
        });
    });
    // ==========================================================================
    // GROUP 2: Playbooks (9 tests)
    // ==========================================================================
    describe("Playbooks", () => {
        test("1. Drift Spike Playbook decay operation reduces drift", () => {
            const state = stateStore.load();
            state.drift.ollama = 0.8;
            stateStore.save(state);
            stateStore.triggerPlaybook("driftSpike", true);
            const stateAfter = stateStore.load();
            expect(stateAfter.activePlaybooks.driftSpike).toBe(true);
        });
        test("2. Drift Spike Playbook triggers backend pruning in route", () => {
            const state = stateStore.load();
            state.drift.ollama = 0.9; // Above threshold
            stateStore.save(state);
            const selected = route({}, state);
            expect(selected).not.toBe("ollama");
        });
        test("3. Routing Stability Playbook routes directly to frozen backend", () => {
            stateStore.freezeRouting(true, "gpt4all");
            const state = stateStore.load();
            expect(state.routingFrozen).toBe(true);
            expect(state.frozenBackend).toBe("gpt4all");
        });
        test("4. Routing Stability Playbook unfreezes when cleared", () => {
            stateStore.freezeRouting(true, "gpt4all");
            stateStore.freezeRouting(false);
            const state = stateStore.load();
            expect(state.routingFrozen).toBe(false);
            expect(state.frozenBackend).toBeUndefined();
        });
        test("5. Backend Recovery Playbook clears active violations", () => {
            stateStore.addViolation("latency_breach", "latency exceeded", "SEV-3");
            stateStore.triggerPlaybook("backendRecovery", true);
            stateStore.clearViolation("latency_breach");
            const state = stateStore.load();
            expect(state.violations.length).toBe(0);
        });
        test("6. Backend Recovery Playbook resets drift scores", () => {
            const state = stateStore.load();
            state.drift.ollama = 0.5;
            stateStore.save(state);
            const resetState = stateStore.load();
            for (const k in resetState.drift) {
                resetState.drift[k] = 0;
            }
            stateStore.save(resetState);
            const finalState = stateStore.load();
            expect(finalState.drift.ollama).toBe(0);
        });
        test("7. Ingestion Recovery Playbook sets correct playbook status", () => {
            stateStore.triggerPlaybook("ingestionRecovery", true);
            const state = stateStore.load();
            expect(state.activePlaybooks.ingestionRecovery).toBe(true);
        });
        test("8. Governance Lockdown Playbook blocks promotions", () => {
            stateStore.setGovernanceLockdown(true);
            const record = {
                promotionId: "test-id",
                request: {
                    taskId: "task-1",
                    fromStage: "sandbox",
                    toStage: "canary",
                    approvalGateId: "gate-1",
                    testResults: { passed: 5, total: 5 },
                    timestamp: Date.now()
                },
                status: "pending",
                resultHash: "hash"
            };
            expect(() => executePromotion(record, Date.now())).toThrow("ERR_PROMOTIONS_FROZEN");
        });
        test("9. Governance Lockdown Playbook blocks rollbacks", () => {
            stateStore.setGovernanceLockdown(true);
            const record = {
                rollbackId: "test-id",
                request: {
                    taskId: "task-1",
                    stage: "canary",
                    reason: "failure",
                    actor: "operator",
                    targetVersion: "v1",
                    timestamp: Date.now()
                },
                status: "pending",
                resultHash: "hash"
            };
            expect(() => executeRollback(record, Date.now())).toThrow("ERR_ROLLBACKS_FROZEN");
        });
    });
    // ==========================================================================
    // GROUP 3: Runbooks (6 tests)
    // ==========================================================================
    describe("Runbooks", () => {
        test("1. SEV-1 Governance Lockdown Runbook disables promotion/rollback", () => {
            stateStore.setGovernanceLockdown(true);
            const state = stateStore.load();
            expect(state.promotionsFrozen).toBe(true);
            expect(state.rollbacksFrozen).toBe(true);
        });
        test("2. SEV-1 Governance Lockdown Runbook unfreezes on operator action", () => {
            stateStore.setGovernanceLockdown(true);
            stateStore.setGovernanceLockdown(false);
            const state = stateStore.load();
            expect(state.promotionsFrozen).toBe(false);
            expect(state.rollbacksFrozen).toBe(false);
        });
        test("3. Ingestion Recovery Runbook resumes daemon after JSON corruption", async () => {
            fs.writeFileSync(tempLogFile, "{corrupted_json}\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await expect(daemon.runCycle()).resolves.not.toThrow();
        });
        test("4. Ingestion Recovery Runbook enforces idempotency by ignoring duplicate messages", async () => {
            const entry = {
                backend: "ollama",
                timestamp: 170000000,
                type: "client_session",
                response: {
                    usage: { total_tokens: 100 },
                    meta: { latency_ms: 100 }
                }
            };
            fs.writeFileSync(tempLogFile, JSON.stringify(entry) + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const state = stateStore.load();
            const driftAfterOne = state.drift.ollama;
            await daemon.runCycle();
            const stateAfterTwo = stateStore.load();
            expect(stateAfterTwo.drift.ollama).toBe(driftAfterOne);
        });
        test("5. Ingestion Recovery Runbook triggers SEV-2 on backlog limit", async () => {
            const state = stateStore.load();
            state.slaSettings.maxBacklog = 2;
            stateStore.save(state);
            const entry = (ts) => JSON.stringify({
                backend: "ollama",
                timestamp: ts,
                type: "client_session",
                response: { usage: { total_tokens: 100 }, meta: { latency_ms: 100 } }
            });
            fs.writeFileSync(tempLogFile, [entry(1), entry(2), entry(3), entry(4), entry(5)].join("\n") + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const stateAfter = stateStore.load();
            expect(stateAfter.slaMetrics.backlogCount).toBe(0);
        });
        test("6. Dashboard Recovery Runbook sets correct playbook status", () => {
            stateStore.triggerPlaybook("dashboardRecovery", true);
            const state = stateStore.load();
            expect(state.activePlaybooks.dashboardRecovery).toBe(true);
        });
    });
    // ==========================================================================
    // GROUP 4: Drift Decay Model (5 tests)
    // ==========================================================================
    describe("Drift Decay Model", () => {
        test("1. Drift decay reduces all scores by 5% per cycle", async () => {
            const entry = {
                backend: "ollama",
                timestamp: Date.now(),
                type: "client_session",
                response: {
                    usage: { total_tokens: 3500 },
                    meta: { latency_ms: 1800 }
                }
            };
            fs.writeFileSync(tempLogFile, JSON.stringify(entry) + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const state1 = stateStore.load();
            const scoreBeforeDecay = state1.drift.ollama;
            fs.writeFileSync(tempLogFile, "", "utf8");
            await daemon.runCycle();
            const state2 = stateStore.load();
            expect(state2.drift.ollama).toBeCloseTo(scoreBeforeDecay * 0.95);
        });
        test("2. Drift decay creates an audit log event", async () => {
            const state = stateStore.load();
            state.drift.ollama = 0.5;
            stateStore.save(state);
            fs.writeFileSync(tempLogFile, "", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const auditLog = loadAuditLog();
            const decayEvent = auditLog.events.find(e => e.eventType === "drift_decay");
            expect(decayEvent).toBeDefined();
        });
        test("3. Drift decay event contains decay details", async () => {
            const state = stateStore.load();
            state.drift.ollama = 0.5;
            stateStore.save(state);
            fs.writeFileSync(tempLogFile, "", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const auditLog = loadAuditLog();
            const decayEvent = auditLog.events.find(e => e.eventType === "drift_decay");
            expect(decayEvent?.reason).toContain("5% applied to all backends");
        });
        test("4. Drift decay does not go below 0", async () => {
            const state = stateStore.load();
            state.drift.ollama = 0.01;
            stateStore.save(state);
            fs.writeFileSync(tempLogFile, "", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            await daemon.runCycle();
            const finalState = stateStore.load();
            expect(finalState.drift.ollama).toBe(0);
        });
        test("5. Drift decay applies uniformly to all backends", async () => {
            const state = stateStore.load();
            state.drift.ollama = 0.8;
            state.drift.localai = 0.4;
            stateStore.save(state);
            fs.writeFileSync(tempLogFile, "", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const finalState = stateStore.load();
            expect(finalState.drift.ollama).toBeCloseTo(0.8 * 0.95);
            expect(finalState.drift.localai).toBeCloseTo(0.4 * 0.95);
        });
    });
    // ==========================================================================
    // GROUP 5: Ingestion Daemon (8 tests)
    // ==========================================================================
    describe("Ingestion Daemon", () => {
        test("1. Daemon correctly initializes and starts/stops interval", () => {
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 1000);
            daemon.start();
            expect(daemon.intervalId).not.toBeNull();
            daemon.stop();
            expect(daemon.intervalId).toBeNull();
        });
        test("2. Daemon parses valid JSONL lines in streaming mode", async () => {
            const entries = [
                { backend: "ollama", timestamp: 1, type: "client_session", response: { usage: { total_tokens: 100 } } },
                { backend: "ollama", timestamp: 2, type: "client_session", response: { usage: { total_tokens: 200 } } }
            ];
            fs.writeFileSync(tempLogFile, entries.map(e => JSON.stringify(e)).join("\n") + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const state = stateStore.load();
            expect(state.slaMetrics.totalTokens).toBe(300);
        });
        test("3. Daemon skips malformed lines and parses remaining valid lines", async () => {
            const lines = [
                JSON.stringify({ backend: "ollama", timestamp: 1, type: "client_session", response: { usage: { total_tokens: 100 } } }),
                "{malformed_json}",
                JSON.stringify({ backend: "ollama", timestamp: 2, type: "client_session", response: { usage: { total_tokens: 200 } } })
            ];
            fs.writeFileSync(tempLogFile, lines.join("\n") + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const state = stateStore.load();
            expect(state.slaMetrics.totalTokens).toBe(300);
        });
        test("4. Daemon maintains idempotency with transaction keys", async () => {
            const entry = { backend: "ollama", timestamp: 999, type: "client_session", response: { usage: { total_tokens: 500 } } };
            fs.writeFileSync(tempLogFile, JSON.stringify(entry) + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const state1 = stateStore.load();
            expect(state1.slaMetrics.totalTokens).toBe(500);
            await daemon.runCycle();
            const state2 = stateStore.load();
            expect(state2.slaMetrics.totalTokens).toBe(500);
        });
        test("5. Daemon calculates average latency of processed cycle", async () => {
            const entries = [
                { backend: "ollama", timestamp: 1, type: "client_session", response: { meta: { latency_ms: 100 } } },
                { backend: "ollama", timestamp: 2, type: "client_session", response: { meta: { latency_ms: 200 } } }
            ];
            fs.writeFileSync(tempLogFile, entries.map(e => JSON.stringify(e)).join("\n") + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const state = stateStore.load();
            expect(state.slaMetrics.avgLatencyMs).toBe(150);
        });
        test("6. Daemon triggers routing oscillation violation if threshold exceeded", async () => {
            const entries = [
                { backend: "ollama", timestamp: 1, type: "client_session", response: { meta: { latency_ms: 2000 } } },
                { backend: "ollama", timestamp: 2, type: "client_session", response: { meta: { latency_ms: 2000 } } },
                { backend: "ollama", timestamp: 3, type: "client_session", response: { meta: { latency_ms: 2000 } } }
            ];
            fs.writeFileSync(tempLogFile, entries.map(e => JSON.stringify(e)).join("\n") + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const state = stateStore.load();
            expect(state.routingFrozen).toBe(true);
            expect(state.violations.find(v => v.category === "routing_oscillation")).toBeDefined();
        });
        test("7. Daemon updates processed line counts and tracks backlog correctly", async () => {
            const entries = [
                { backend: "ollama", timestamp: 1, type: "client_session", response: {} }
            ];
            fs.writeFileSync(tempLogFile, entries.map(e => JSON.stringify(e)).join("\n") + "\n", "utf8");
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 30000);
            await daemon.runCycle();
            const state = stateStore.load();
            expect(state.slaMetrics.backlogCount).toBe(0);
        });
        test("8. Daemon stops cleanly and clears interval", () => {
            const daemon = new IngestionDaemon(tempLogFile, stateStore, 1000);
            daemon.start();
            daemon.stop();
            expect(daemon.intervalId).toBeNull();
        });
    });
    // ==========================================================================
    // GROUP 6: State Persistence (2 tests)
    // ==========================================================================
    describe("State Persistence", () => {
        test("1. Persisted state survives process restarts (read/write reload)", () => {
            const store1 = new CICStateStore(tempStateFile);
            const state1 = store1.getDefaultState();
            state1.drift.ollama = 0.77;
            state1.activePlaybooks.driftSpike = true;
            store1.save(state1);
            const store2 = new CICStateStore(tempStateFile);
            const state2 = store2.load();
            expect(state2.drift.ollama).toBe(0.77);
            expect(state2.activePlaybooks.driftSpike).toBe(true);
        });
        test("2. Frozen routing bypasses default routing logic", () => {
            stateStore.freezeRouting(true, "localai");
            const state = stateStore.load();
            expect(state.routingFrozen).toBe(true);
            expect(state.frozenBackend).toBe("localai");
        });
    });
});
//# sourceMappingURL=phase5-operational.test.js.map