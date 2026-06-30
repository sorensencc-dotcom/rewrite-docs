/*
  filename: approval-gate.ts
  purpose: deterministic approval gate for pipeline promotion
  version: 1.0.0
*/

import crypto from "crypto";

export interface ApprovalRequest {
  taskId: string;
  pipelineName: string;
  sourceStage: string;
  targetStage: string;
  hash: string;
  requiredApprovers: string[];
  timestamp: number;
}

export interface Approval {
  approver: string;
  timestamp: number;
  signature: string;
  reasoning: string;
}

export interface ApprovalGate {
  requestId: string;
  request: ApprovalRequest;
  approvals: Approval[];
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: number;
  expiresAt: number;
  finalHash: string;
}

function signApproval(
  approver: string,
  taskId: string,
  hash: string,
  timestamp: number
): string {
  const input = `${approver}:${taskId}:${hash}:${timestamp}`;
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function createApprovalGate(
  request: ApprovalRequest,
  expiryMinutes: number = 30
): ApprovalGate {
  const requestId = crypto
    .createHash("sha256")
    .update(`${request.taskId}:${request.sourceStage}:${request.targetStage}`)
    .digest("hex");

  const now = 0;
  return {
    requestId,
    request,
    approvals: [],
    status: "pending",
    createdAt: now,
    expiresAt: now + expiryMinutes * 60,
    finalHash: ""
  };
}

export function addApproval(
  gate: ApprovalGate,
  approver: string,
  reasoning: string,
  timestamp: number
): ApprovalGate {
  if (gate.status !== "pending") {
    throw new Error(`Gate ${gate.requestId} is not pending`);
  }

  if (!gate.request.requiredApprovers.includes(approver)) {
    throw new Error(`${approver} is not authorized for this gate`);
  }

  const signature = signApproval(approver, gate.request.taskId, gate.request.hash, timestamp);
  const approval: Approval = { approver, timestamp, signature, reasoning };

  const updated = { ...gate, approvals: [...gate.approvals, approval] };

  if (updated.approvals.length === gate.request.requiredApprovers.length) {
    updated.status = "approved";
    updated.finalHash = computeGateHash(updated);
  }

  return updated;
}

export function computeGateHash(gate: ApprovalGate): string {
  const input = JSON.stringify({
    requestId: gate.requestId,
    taskId: gate.request.taskId,
    hash: gate.request.hash,
    approvals: gate.approvals.map(a => ({ approver: a.approver, signature: a.signature }))
  });

  return crypto.createHash("sha256").update(input).digest("hex");
}

export function validateGate(gate: ApprovalGate): {
  valid: boolean;
  reason?: string;
} {
  if (gate.status === "rejected") {
    return { valid: false, reason: "Gate was rejected" };
  }

  if (gate.status === "expired") {
    return { valid: false, reason: "Gate expired" };
  }

  if (gate.status !== "approved") {
    return { valid: false, reason: `Gate status is ${gate.status}` };
  }

  if (gate.finalHash !== computeGateHash(gate)) {
    return { valid: false, reason: "Gate hash mismatch" };
  }

  return { valid: true };
}

export function rejectGate(
  gate: ApprovalGate,
  rejector: string,
  reasoning: string
): ApprovalGate {
  return {
    ...gate,
    status: "rejected",
    approvals: [
      ...gate.approvals,
      {
        approver: rejector,
        timestamp: 0,
        signature: "",
        reasoning: `REJECTED: ${reasoning}`
      }
    ]
  };
}
