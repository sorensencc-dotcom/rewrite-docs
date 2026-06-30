/*
  filename: governance-orchestrator.ts
  purpose: orchestrate approval gates, audits, and promotion/rollback flows
  version: 1.0.0
*/

import {
  ApprovalRequest,
  ApprovalGate,
  createApprovalGate,
  addApproval,
  validateGate
} from "./approval-gate.ts";
import {
  AuditEvent,
  createAuditEvent,
  appendAuditEvent,
  checkMinimumApprovals,
  checkTestResults
} from "./audit-policy.ts";
import {
  PromotionRequest,
  RollbackRequest,
  PromotionRecord,
  RollbackRecord,
  createPromotionRecord,
  executePromotion,
  completePromotion,
  validatePromotionPath,
  validateRollbackSafety,
  createRollbackRecord,
  executeRollback,
  completeRollback,
  appendPromotionRecord
} from "./promotion-rollback.ts";

export interface GovernanceFlow {
  taskId: string;
  phase: "approval" | "audit" | "promotion" | "rollback" | "complete";
  gate?: ApprovalGate;
  auditLog?: AuditEvent[];
  promotionRecord?: PromotionRecord;
  rollbackRecord?: RollbackRecord;
  status: "pending" | "success" | "failure";
  reason?: string;
}

export function orchestratePromotion(
  promotionRequest: PromotionRequest,
  approvalRequest: ApprovalRequest,
  approvers: Array<{ name: string; reasoning: string }>
): GovernanceFlow {
  try {
    const pathValidation = validatePromotionPath(
      promotionRequest.fromStage,
      promotionRequest.toStage
    );
    if (!pathValidation.valid) {
      return {
        taskId: promotionRequest.taskId,
        phase: "approval",
        status: "failure",
        reason: pathValidation.reason
      };
    }

    let gate = createApprovalGate(approvalRequest);
    const auditEvents: AuditEvent[] = [];

    for (const approver of approvers) {
      gate = addApproval(gate, approver.name, approver.reasoning, 0);

      const auditEvent = createAuditEvent(
        "gate_approved",
        approver.name,
        promotionRequest.taskId,
        promotionRequest.toStage,
        "success",
        approver.reasoning,
        [],
        []
      );
      auditEvents.push(auditEvent);
      appendAuditEvent(auditEvent);
    }

    const gateValidation = validateGate(gate);
    if (!gateValidation.valid) {
      return {
        taskId: promotionRequest.taskId,
        phase: "approval",
        gate,
        auditLog: auditEvents,
        status: "failure",
        reason: gateValidation.reason
      };
    }

    const minApprovalsCheck = checkMinimumApprovals(gate.approvals.length);
    const testCheck = checkTestResults(
      promotionRequest.testResults.passed,
      promotionRequest.testResults.total
    );

    if (!minApprovalsCheck.passed || !testCheck.passed) {
      const failureEvent = createAuditEvent(
        "promotion_requested",
        "system",
        promotionRequest.taskId,
        promotionRequest.toStage,
        "failure",
        `Audit checks failed: ${!minApprovalsCheck.passed ? minApprovalsCheck.message : testCheck.message}`,
        [],
        [
          minApprovalsCheck.passed ? "" : minApprovalsCheck.message,
          testCheck.passed ? "" : testCheck.message
        ].filter(Boolean)
      );
      appendAuditEvent(failureEvent);
      auditEvents.push(failureEvent);

      return {
        taskId: promotionRequest.taskId,
        phase: "audit",
        gate,
        auditLog: auditEvents,
        status: "failure",
        reason: "Audit checks failed"
      };
    }

    let promotionRecord = createPromotionRecord(promotionRequest);
    promotionRecord = executePromotion(promotionRecord, 0);
    promotionRecord = completePromotion(promotionRecord, 0);

    const promotionEvent = createAuditEvent(
      "promotion_executed",
      "orchestrator",
      promotionRequest.taskId,
      promotionRequest.toStage,
      "success",
      `Promoted from ${promotionRequest.fromStage} to ${promotionRequest.toStage}`,
      [minApprovalsCheck.message, testCheck.message],
      []
    );
    appendAuditEvent(promotionEvent);
    auditEvents.push(promotionEvent);

    appendPromotionRecord(promotionRecord);

    return {
      taskId: promotionRequest.taskId,
      phase: "promotion",
      gate,
      auditLog: auditEvents,
      promotionRecord,
      status: "success"
    };
  } catch (err) {
    const errorEvent = createAuditEvent(
      "promotion_requested",
      "system",
      promotionRequest.taskId,
      promotionRequest.toStage,
      "failure",
      `Exception: ${(err as Error).message}`,
      [],
      [(err as Error).message]
    );
    appendAuditEvent(errorEvent);

    return {
      taskId: promotionRequest.taskId,
      phase: "approval",
      auditLog: [errorEvent],
      status: "failure",
      reason: (err as Error).message
    };
  }
}

export function orchestrateRollback(
  rollbackRequest: RollbackRequest,
  lastPromotionTime: number
): GovernanceFlow {
  try {
    const safety = validateRollbackSafety(lastPromotionTime, rollbackRequest.timestamp);
    if (!safety.safe) {
      const safetyEvent = createAuditEvent(
        "rollback_initiated",
        rollbackRequest.actor,
        rollbackRequest.taskId,
        rollbackRequest.stage,
        "failure",
        `Cooldown period active: ${safety.minutesUntilSafe} minutes remaining`,
        [],
        ["Cooldown period not elapsed"]
      );
      appendAuditEvent(safetyEvent);

      return {
        taskId: rollbackRequest.taskId,
        phase: "rollback",
        auditLog: [safetyEvent],
        status: "failure",
        reason: `Cooldown period active: ${safety.minutesUntilSafe} minutes remaining`
      };
    }

    let rollbackRecord = createRollbackRecord(rollbackRequest);
    rollbackRecord = executeRollback(rollbackRecord, rollbackRequest.timestamp);
    rollbackRecord = completeRollback(rollbackRecord, rollbackRequest.timestamp);

    const rollbackEvent = createAuditEvent(
      "rollback_completed",
      rollbackRequest.actor,
      rollbackRequest.taskId,
      rollbackRequest.stage,
      "success",
      `Rolled back to ${rollbackRequest.targetVersion}: ${rollbackRequest.reason}`,
      ["Safety checks passed"],
      []
    );
    appendAuditEvent(rollbackEvent);

    return {
      taskId: rollbackRequest.taskId,
      phase: "rollback",
      auditLog: [rollbackEvent],
      rollbackRecord,
      status: "success"
    };
  } catch (err) {
    const errorEvent = createAuditEvent(
      "rollback_initiated",
      rollbackRequest.actor,
      rollbackRequest.taskId,
      rollbackRequest.stage,
      "failure",
      `Exception: ${(err as Error).message}`,
      [],
      [(err as Error).message]
    );
    appendAuditEvent(errorEvent);

    return {
      taskId: rollbackRequest.taskId,
      phase: "rollback",
      auditLog: [errorEvent],
      status: "failure",
      reason: (err as Error).message
    };
  }
}
