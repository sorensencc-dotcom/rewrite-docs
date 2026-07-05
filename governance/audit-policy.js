/*
  filename: audit-policy.ts
  purpose: audit logging and policy enforcement for governance decisions
  version: 1.0.0
*/
import fs from "fs";
import crypto from "crypto";
import path from "path";
export function checkMinimumApprovals(approvalCount) {
    const required = 2;
    if (approvalCount >= required) {
        return { passed: true, message: `✓ Minimum approvals met (${approvalCount}/${required})` };
    }
    return { passed: false, message: `✗ Minimum approvals not met (${approvalCount}/${required})` };
}
export function checkCooldownPeriod(promotionTime, currentTime) {
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
export function checkTestResults(testsPassed, testsTotal) {
    if (testsPassed === testsTotal) {
        return { passed: true, message: `✓ All tests passed (${testsPassed}/${testsTotal})` };
    }
    return { passed: false, message: `✗ Tests failing (${testsPassed}/${testsTotal})` };
}
export function createAuditEvent(eventType, actor, taskId, targetStage, status, reason, policyChecksPassed, policyChecksFailed) {
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
        timestamp: Date.now()
    };
}
export function loadAuditLog(logPath = "governance/audit-log.json") {
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
export function appendAuditEvent(event, logPath = "governance/audit-log.json") {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    let log = loadAuditLog(logPath);
    // Implement cryptographic hash-chaining: incorporate previous event's hash
    const previousHash = log.lastEventHash || "";
    const chainedHash = crypto
        .createHash("sha256")
        .update(`${previousHash}:${event.eventId}:${event.status}`)
        .digest("hex");
    event.hash = chainedHash;
    log.events.push(event);
    log.totalEvents = log.events.length;
    log.successCount = log.events.filter(e => e.status === "success").length;
    log.failureCount = log.events.filter(e => e.status === "failure").length;
    log.lastEventHash = chainedHash;
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    return log;
}
export function generateAuditReport(taskId, logPath = "governance/audit-log.json") {
    const log = loadAuditLog(logPath);
    const taskEvents = log.events.filter(e => e.taskId === taskId);
    let summary = "";
    if (taskEvents.length === 0) {
        summary = `No audit events for task ${taskId}`;
    }
    else {
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
export function verifyAuditChain(logPath) {
    const finalPath = logPath || process.env.AUDIT_LOG_FILE || path.resolve(process.cwd(), "governance", "audit-log.json");
    if (!fs.existsSync(finalPath)) {
        return { valid: true };
    }
    try {
        const log = JSON.parse(fs.readFileSync(finalPath, "utf8"));
        let prevHash = "";
        for (let i = 0; i < log.events.length; i++) {
            const event = log.events[i];
            const expectedHash = crypto
                .createHash("sha256")
                .update(`${prevHash}:${event.eventId}:${event.status}`)
                .digest("hex");
            if (event.hash !== expectedHash) {
                return { valid: false, breakAt: i };
            }
            prevHash = event.hash;
        }
    }
    catch (err) {
        return { valid: false, breakAt: 0 };
    }
    return { valid: true };
}
//# sourceMappingURL=audit-policy.js.map