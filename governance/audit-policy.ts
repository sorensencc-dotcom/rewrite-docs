/*
  filename: audit-policy.ts
  purpose: audit logging and policy enforcement for governance decisions
  version: 1.0.0
*/

import fs from "fs";
import crypto from "crypto";
import path from "path";

export interface AuditEvent {
  eventId: string;
  eventType:
    | "gate_created"
    | "gate_approved"
    | "gate_rejected"
    | "promotion_requested"
    | "promotion_executed"
    | "rollback_initiated"
    | "rollback_completed";
  actor: string;
  taskId: string;
  targetStage: string;
  status: "success" | "failure";
  reason: string;
  policyChecksPassed: string[];
  policyChecksFailed: string[];
  hash: string;
  timestamp: number;
}

export interface AuditLog {
  events: AuditEvent[];
  totalEvents: number;
  successCount: number;
  failureCount: number;
  lastEventHash: string;
}

export function checkMinimumApprovals(approvalCount: number): {
  passed: boolean;
  message: string;
} {
  const required = 2;
  if (approvalCount >= required) {
    return { passed: true, message: `✓ Minimum approvals met (${approvalCount}/${required})` };
  }
  return { passed: false, message: `✗ Minimum approvals not met (${approvalCount}/${required})` };
}

export function checkCooldownPeriod(
  promotionTime: number,
  currentTime: number
): {
  passed: boolean;
  message: string;
} {
  const cooldownSeconds = 5 * 60;
  const elapsed = currentTime - promotionTime;

  if (elapsed >= cooldownSeconds) {
    return {
      passed: true,
      message: `✓ Cooldown period elapsed (${elapsed}s >= ${cooldownSeconds}s)`
    };
  }

  return {
    passed: false,
    message: `✗ Cooldown period active (${elapsed}s < ${cooldownSeconds}s)`
  };
}

export function checkTestResults(testsPassed: number, testsTotal: number): {
  passed: boolean;
  message: string;
} {
  if (testsPassed === testsTotal) {
    return { passed: true, message: `✓ All tests passed (${testsPassed}/${testsTotal})` };
  }
  return { passed: false, message: `✗ Tests failing (${testsPassed}/${testsTotal})` };
}

export function createAuditEvent(
  eventType: AuditEvent["eventType"],
  actor: string,
  taskId: string,
  targetStage: string,
  status: "success" | "failure",
  reason: string,
  policyChecksPassed: string[],
  policyChecksFailed: string[]
): AuditEvent {
  const eventId = crypto
    .createHash("sha256")
    .update(`${taskId}:${eventType}:${actor}`)
    .digest("hex");

  const hash = crypto
    .createHash("sha256")
    .update(`${eventId}:${status}:${policyChecksFailed.join("|")}`)
    .digest("hex");

  return {
    eventId,
    eventType,
    actor,
    taskId,
    targetStage,
    status,
    reason,
    policyChecksPassed,
    policyChecksFailed,
    hash,
    timestamp: 0
  };
}

export function loadAuditLog(logPath: string = "governance/audit-log.json"): AuditLog {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  if (!fs.existsSync(logPath)) {
    return {
      events: [],
      totalEvents: 0,
      successCount: 0,
      failureCount: 0,
      lastEventHash: ""
    };
  }

  return JSON.parse(fs.readFileSync(logPath, "utf8"));
}

export function appendAuditEvent(
  event: AuditEvent,
  logPath: string = "governance/audit-log.json"
): AuditLog {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  let log = loadAuditLog(logPath);

  log.events.push(event);
  log.totalEvents = log.events.length;
  log.successCount = log.events.filter(e => e.status === "success").length;
  log.failureCount = log.events.filter(e => e.status === "failure").length;
  log.lastEventHash = event.hash;

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  return log;
}

export function generateAuditReport(
  taskId: string,
  logPath: string = "governance/audit-log.json"
): {
  taskId: string;
  events: AuditEvent[];
  summary: string;
} {
  const log = loadAuditLog(logPath);
  const taskEvents = log.events.filter(e => e.taskId === taskId);

  let summary = "";
  if (taskEvents.length === 0) {
    summary = `No audit events for task ${taskId}`;
  } else {
    const successes = taskEvents.filter(e => e.status === "success").length;
    const failures = taskEvents.filter(e => e.status === "failure").length;
    summary = `Task ${taskId}: ${successes} successes, ${failures} failures`;
  }

  return {
    taskId,
    events: taskEvents,
    summary
  };
}
