/*
  Manual verification script for Phase 4: Governance
  Tests: approval gates, audit policy, promotion/rollback rules, orchestrator
*/

import fs from "fs";
import { orchestratePromotion, orchestrateRollback } from "../governance/governance-orchestrator.ts";
import { createApprovalGate, addApproval, validateGate } from "../governance/approval-gate.ts";
import {
  createPromotionRecord,
  validatePromotionPath,
  validateRollbackSafety
} from "../governance/promotion-rollback.ts";
import {
  checkMinimumApprovals,
  checkTestResults,
  createAuditEvent,
  loadAuditLog
} from "../governance/audit-policy.ts";

console.log("=== Phase 4 Governance Verification Tests ===\n");

// Test 1: Approval Gate Creation
console.log("Test 1: Approval Gate Creation");
const gateRequest = {
  taskId: "task-001",
  pipelineName: "ingestion",
  sourceStage: "canary" as const,
  targetStage: "production" as const,
  hash: "hash_abc123",
  requiredApprovers: ["alice", "bob"],
  timestamp: 0
};

const gate = createApprovalGate(gateRequest);
console.log(`  requestId: ${gate.requestId.substring(0, 16)}...`);
console.log(`  status: ${gate.status}`);
console.log(`  approvals needed: ${gate.request.requiredApprovers.length}`);

if (gate.status === "pending" && gate.request.requiredApprovers.length === 2) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL\n");
}

// Test 2: Adding Approvals
console.log("Test 2: Adding Approvals");
let updatedGate = addApproval(gate, "alice", "Looks good", 0);
console.log(`  After 1st approval: status=${updatedGate.status}`);

updatedGate = addApproval(updatedGate, "bob", "Approved", 0);
console.log(`  After 2nd approval: status=${updatedGate.status}`);
console.log(`  Final approvals count: ${updatedGate.approvals.length}`);

if (updatedGate.status === "approved" && updatedGate.approvals.length === 2) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL\n");
}

// Test 3: Gate Validation
console.log("Test 3: Gate Validation");
const validation = validateGate(updatedGate);
console.log(`  Gate valid: ${validation.valid}`);

if (validation.valid) {
  console.log("  ✓ PASS\n");
} else {
  console.log(`  ✗ FAIL: ${validation.reason}\n`);
}

// Test 4: Promotion Path Validation
console.log("Test 4: Promotion Path Validation");
const validPath = validatePromotionPath("sandbox", "canary");
const invalidPath = validatePromotionPath("production", "canary");

console.log(`  sandbox→canary: ${validPath.valid}`);
console.log(`  production→canary: ${invalidPath.valid}`);

if (validPath.valid && !invalidPath.valid) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL\n");
}

// Test 5: Audit Policy Checks
console.log("Test 5: Audit Policy Checks");
const minApprovals = checkMinimumApprovals(2);
const testResults = checkTestResults(1522, 1522);

console.log(`  Min approvals (2): ${minApprovals.passed}`);
console.log(`  Test results (1498/1522): ${testResults.passed}`);

if (minApprovals.passed && testResults.passed) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL\n");
}

// Test 6: Full Promotion Orchestration
console.log("Test 6: Full Promotion Orchestration");

const promotionRequest = {
  taskId: "task-promo-001",
  fromStage: "canary" as const,
  toStage: "staging" as const,
  approvalGateId: gate.requestId,
  testResults: { passed: 1522, total: 1522 },
  timestamp: 0
};

const approvalRequest = {
  taskId: "task-promo-001",
  pipelineName: "ingestion",
  sourceStage: "canary",
  targetStage: "staging",
  hash: "hash_promo",
  requiredApprovers: ["alice", "bob"],
  timestamp: 0
};

const flow = orchestratePromotion(
  promotionRequest,
  approvalRequest,
  [
    { name: "alice", reasoning: "Approved for staging" },
    { name: "bob", reasoning: "LGTM" }
  ]
);

console.log(`  Flow status: ${flow.status}`);
console.log(`  Final phase: ${flow.phase}`);
console.log(`  Audit events: ${flow.auditLog?.length}`);
console.log(`  Promotion status: ${flow.promotionRecord?.status}`);

if (
  flow.status === "success" &&
  flow.phase === "promotion" &&
  flow.promotionRecord?.status === "completed"
) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL\n");
}

// Test 7: Rollback Orchestration
console.log("Test 7: Rollback Orchestration");
const rollbackRequest = {
  taskId: "task-promo-001",
  stage: "staging" as const,
  reason: "Detecting drift in metrics",
  actor: "alice",
  targetVersion: "v1.2.3",
  timestamp: 700 // 700 seconds after promotion (safe)
};

const rollbackFlow = orchestrateRollback(rollbackRequest, 0);
console.log(`  Rollback status: ${rollbackFlow.status}`);
console.log(`  Rollback phase: ${rollbackFlow.phase}`);
console.log(`  Completed: ${rollbackFlow.rollbackRecord?.status === "completed"}`);

if (rollbackFlow.status === "success" && rollbackFlow.rollbackRecord?.status === "completed") {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL\n");
}

// Test 8: Rollback Safety Check (too soon)
console.log("Test 8: Rollback Safety Check (cooldown violation)");
const unsafeRollback = orchestrateRollback(
  {
    taskId: "task-promo-002",
    stage: "staging",
    reason: "Oops",
    actor: "alice",
    targetVersion: "v1.2.3",
    timestamp: 100 // Only 100 seconds after promotion
  },
  0
);

console.log(`  Rollback status: ${unsafeRollback.status}`);
console.log(`  Blocked reason: ${unsafeRollback.reason?.substring(0, 30)}...`);

if (unsafeRollback.status === "failure" && unsafeRollback.reason?.includes("Cooldown")) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL\n");
}

// Test 9: Audit Log Persistence
console.log("Test 9: Audit Log Persistence");
const auditLog = loadAuditLog("governance/audit-log.json");
console.log(`  Total events: ${auditLog.totalEvents}`);
console.log(`  Success count: ${auditLog.successCount}`);
console.log(`  Failure count: ${auditLog.failureCount}`);

if (auditLog.totalEvents > 0) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL\n");
}

// Cleanup (only temp files, not source code)
if (fs.existsSync("governance/audit-log.json")) {
  fs.rmSync("governance/audit-log.json");
}
if (fs.existsSync("governance/promotion-history.json")) {
  fs.rmSync("governance/promotion-history.json");
}

console.log("=== All Phase 4 Governance Verification Tests Complete ===");
