/*
  filename: promotion-rollback.ts
  purpose: deterministic promotion and rollback rules for pipeline stages
  version: 1.0.0
*/

import crypto from "crypto";
import fs from "fs";
import { CICStateStore } from "../src/server/cicStateStore.js";

export const ERR_PROMOTIONS_FROZEN = "ERR_PROMOTIONS_FROZEN";
export const ERR_ROLLBACKS_FROZEN = "ERR_ROLLBACKS_FROZEN";

export type Stage = "sandbox" | "canary" | "staging" | "production";

export interface PromotionRequest {
  taskId: string;
  fromStage: Stage;
  toStage: Stage;
  approvalGateId: string;
  testResults: { passed: number; total: number };
  timestamp: number;
}

export interface RollbackRequest {
  taskId: string;
  stage: Stage;
  reason: string;
  actor: string;
  targetVersion: string;
  timestamp: number;
}

export interface PromotionRecord {
  promotionId: string;
  request: PromotionRequest;
  status: "pending" | "executing" | "completed" | "failed";
  executedAt?: number;
  resultHash: string;
}

export interface RollbackRecord {
  rollbackId: string;
  request: RollbackRequest;
  status: "pending" | "executing" | "completed" | "failed";
  executedAt?: number;
  resultHash: string;
}

const STAGE_ORDER: Stage[] = ["sandbox", "canary", "staging", "production"];

export function validatePromotionPath(
  fromStage: Stage,
  toStage: Stage
): {
  valid: boolean;
  reason?: string;
} {
  const fromIdx = STAGE_ORDER.indexOf(fromStage);
  const toIdx = STAGE_ORDER.indexOf(toStage);

  if (fromIdx === -1 || toIdx === -1) {
    return { valid: false, reason: "Invalid stage" };
  }

  if (toIdx <= fromIdx) {
    return { valid: false, reason: "Can only promote forward" };
  }

  if (toIdx - fromIdx !== 1) {
    return { valid: false, reason: "Can only promote one stage at a time" };
  }

  return { valid: true };
}

export function createPromotionRecord(request: PromotionRequest): PromotionRecord {
  const promotionId = crypto
    .createHash("sha256")
    .update(`${request.taskId}:${request.fromStage}:${request.toStage}`)
    .digest("hex");

  const resultHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        taskId: request.taskId,
        path: `${request.fromStage}->${request.toStage}`,
        gateId: request.approvalGateId,
        tests: `${request.testResults.passed}/${request.testResults.total}`
      })
    )
    .digest("hex");

  return {
    promotionId,
    request,
    status: "pending",
    resultHash
  };
}

export function executePromotion(record: PromotionRecord, timestamp: number): PromotionRecord {
  if (record.status !== "pending") {
    throw new Error(`Promotion ${record.promotionId} is not pending`);
  }

  // Check if promotions are frozen
  const stateStore = new CICStateStore();
  const state = stateStore.load();
  if (state.promotionsFrozen) {
    throw new Error(ERR_PROMOTIONS_FROZEN);
  }

  return {
    ...record,
    status: "executing",
    executedAt: timestamp
  };
}

export function completePromotion(
  record: PromotionRecord,
  timestamp: number
): PromotionRecord {
  if (record.status !== "executing") {
    throw new Error(`Promotion ${record.promotionId} is not executing`);
  }

  return {
    ...record,
    status: "completed",
    executedAt: timestamp
  };
}

export function failPromotion(
  record: PromotionRecord,
  reason: string,
  timestamp: number
): PromotionRecord {
  return {
    ...record,
    status: "failed",
    executedAt: timestamp,
    resultHash: crypto
      .createHash("sha256")
      .update(record.resultHash + reason)
      .digest("hex")
  };
}

export function validateRollbackSafety(
  promoteTime: number,
  rollbackTime: number
): {
  safe: boolean;
  minutesUntilSafe?: number;
} {
  const cooldownMinutes = 5;
  const elapsedMinutes = (rollbackTime - promoteTime) / 60;

  if (elapsedMinutes >= cooldownMinutes) {
    return { safe: true };
  }

  return { safe: false, minutesUntilSafe: Math.ceil(cooldownMinutes - elapsedMinutes) };
}

export function createRollbackRecord(request: RollbackRequest): RollbackRecord {
  const rollbackId = crypto
    .createHash("sha256")
    .update(`${request.taskId}:${request.stage}:${request.actor}`)
    .digest("hex");

  const resultHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        taskId: request.taskId,
        stage: request.stage,
        targetVersion: request.targetVersion,
        reason: request.reason
      })
    )
    .digest("hex");

  return {
    rollbackId,
    request,
    status: "pending",
    resultHash
  };
}

export function executeRollback(record: RollbackRecord, timestamp: number): RollbackRecord {
  if (record.status !== "pending") {
    throw new Error(`Rollback ${record.rollbackId} is not pending`);
  }

  // Check if rollbacks are frozen
  const stateStore = new CICStateStore();
  const state = stateStore.load();
  if (state.rollbacksFrozen) {
    throw new Error(ERR_ROLLBACKS_FROZEN);
  }

  return {
    ...record,
    status: "executing",
    executedAt: timestamp
  };
}

export function completeRollback(
  record: RollbackRecord,
  timestamp: number
): RollbackRecord {
  if (record.status !== "executing") {
    throw new Error(`Rollback ${record.rollbackId} is not executing`);
  }

  return {
    ...record,
    status: "completed",
    executedAt: timestamp
  };
}

export function loadPromotionHistory(filePath: string = "governance/promotion-history.json"): PromotionRecord[] {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function appendPromotionRecord(
  record: PromotionRecord,
  filePath: string = "governance/promotion-history.json"
): void {
  fs.mkdirSync("governance", { recursive: true });
  const history = loadPromotionHistory(filePath);
  history.push(record);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
}
