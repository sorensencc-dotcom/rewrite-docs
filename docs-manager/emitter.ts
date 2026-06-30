// C:\dev\docs-manager\emitter.ts

import * as fs from "fs";
import * as path from "path";

const JSONL_PATH = path.join(
  process.cwd(),
  "cic-ingestion",
  "logs",
  "docs_manager.jsonl"
);

const OUT_DIR = path.join(process.cwd(), "docs-manager", "out");

let sequenceCounter = 0;

// === Type Definitions (mirror spec) ===

export interface DocsManagerEventEnvelope {
  schemaVersion: "1.0.0";
  type: "audit" | "drift" | "sync" | "consolidation";
  timestamp: number;
  sequenceId: number;
}

export interface AuditEvent extends DocsManagerEventEnvelope {
  type: "audit";
  docId: string;
  path: string;
  severity: "info" | "warning" | "error";
  category: "schema" | "format" | "reference" | "coverage";
  message: string;
  details?: {
    expectedSchema?: string;
    actualValue?: string;
    suggestedFix?: string;
  };
}

export interface DriftEvent extends DocsManagerEventEnvelope {
  type: "drift";
  docId: string;
  specId: string;
  path: string;
  driftType: "semantic" | "structural" | "reference";
  similarityScore: number;
  threshold: number;
  breached: boolean;
  changes?: string[];
}

export interface SyncEvent extends DocsManagerEventEnvelope {
  type: "sync";
  docId: string;
  syncType: "refresh" | "promotion" | "rollback";
  fromVersion: string;
  toVersion: string;
  path: string;
  status: "initiated" | "in_progress" | "success" | "failed";
  duration?: number;
  errorMessage?: string;
  metadata?: {
    approverIds?: string[];
    changeLog?: string;
    rollbackOf?: number;
  };
}

export interface ConsolidationEvent extends DocsManagerEventEnvelope {
  type: "consolidation";
  consolidationId: string;
  sourceDocIds: string[];
  targetDocId: string;
  status: "initiated" | "in_progress" | "success" | "failed";
  duration?: number;
  mergeStrategy: "semantic" | "structural" | "manual";
  conflictCount?: number;
  metadata?: {
    rationale?: string;
    approverIds?: string[];
    errorDetails?: string;
  };
}

export type DocsManagerEvent =
  | AuditEvent
  | DriftEvent
  | SyncEvent
  | ConsolidationEvent;

// === Validation ===

function validateEvent(event: DocsManagerEvent): { valid: boolean; error?: string } {
  if (event.schemaVersion !== "1.0.0") {
    return { valid: false, error: "Invalid schemaVersion" };
  }

  if (!["audit", "drift", "sync", "consolidation"].includes(event.type)) {
    return { valid: false, error: "Invalid event type" };
  }

  if (typeof event.timestamp !== "number" || event.timestamp <= 0) {
    return { valid: false, error: "Invalid timestamp" };
  }

  const now = Date.now();
  const fiveSecondsMs = 5 * 1000;
  if (Math.abs(event.timestamp - now) > fiveSecondsMs) {
    return { valid: false, error: "Timestamp outside ±5s window" };
  }

  if (typeof event.sequenceId !== "number" || event.sequenceId <= 0) {
    return { valid: false, error: "Invalid sequenceId" };
  }

  if (event.sequenceId <= sequenceCounter) {
    return { valid: false, error: `sequenceId ${event.sequenceId} not > last ${sequenceCounter}` };
  }

  // Type-specific validation
  if (event.type === "audit") {
    const audit = event as AuditEvent;
    if (!["info", "warning", "error"].includes(audit.severity)) {
      return { valid: false, error: "Invalid audit severity" };
    }
    if (!["schema", "format", "reference", "coverage"].includes(audit.category)) {
      return { valid: false, error: "Invalid audit category" };
    }
  }

  if (event.type === "drift") {
    const drift = event as DriftEvent;
    if (drift.similarityScore < 0 || drift.similarityScore > 1) {
      return { valid: false, error: "similarityScore must be 0.0–1.0" };
    }
    if (!["semantic", "structural", "reference"].includes(drift.driftType)) {
      return { valid: false, error: "Invalid drift type" };
    }
  }

  if (event.type === "sync") {
    const sync = event as SyncEvent;
    if (!["refresh", "promotion", "rollback"].includes(sync.syncType)) {
      return { valid: false, error: "Invalid sync type" };
    }
    if (!["initiated", "in_progress", "success", "failed"].includes(sync.status)) {
      return { valid: false, error: "Invalid sync status" };
    }
  }

  if (event.type === "consolidation") {
    const cons = event as ConsolidationEvent;
    if (!["semantic", "structural", "manual"].includes(cons.mergeStrategy)) {
      return { valid: false, error: "Invalid merge strategy" };
    }
    if (!["initiated", "in_progress", "success", "failed"].includes(cons.status)) {
      return { valid: false, error: "Invalid consolidation status" };
    }
  }

  return { valid: true };
}

// === Emission ===

function ensureOutDir(): void {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
}

function ensureJsonlDir(): void {
  const dir = path.dirname(JSONL_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function emitAudit(
  docId: string,
  path: string,
  severity: "info" | "warning" | "error",
  category: "schema" | "format" | "reference" | "coverage",
  message: string,
  details?: AuditEvent["details"]
): void {
  const event: AuditEvent = {
    schemaVersion: "1.0.0",
    type: "audit",
    timestamp: Date.now(),
    sequenceId: ++sequenceCounter,
    docId,
    path,
    severity,
    category,
    message,
    details,
  };

  const validation = validateEvent(event);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.error}`);
  }

  emitEvent(event);
}

export function emitDrift(
  docId: string,
  specId: string,
  path: string,
  driftType: "semantic" | "structural" | "reference",
  similarityScore: number,
  threshold: number,
  changes?: string[]
): void {
  const event: DriftEvent = {
    schemaVersion: "1.0.0",
    type: "drift",
    timestamp: Date.now(),
    sequenceId: ++sequenceCounter,
    docId,
    specId,
    path,
    driftType,
    similarityScore,
    threshold,
    breached: similarityScore < threshold,
    changes,
  };

  const validation = validateEvent(event);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.error}`);
  }

  emitEvent(event);
}

export function emitSync(
  docId: string,
  syncType: "refresh" | "promotion" | "rollback",
  fromVersion: string,
  toVersion: string,
  path: string,
  status: "initiated" | "in_progress" | "success" | "failed",
  options?: {
    duration?: number;
    errorMessage?: string;
    metadata?: SyncEvent["metadata"];
  }
): void {
  const event: SyncEvent = {
    schemaVersion: "1.0.0",
    type: "sync",
    timestamp: Date.now(),
    sequenceId: ++sequenceCounter,
    docId,
    syncType,
    fromVersion,
    toVersion,
    path,
    status,
    duration: options?.duration,
    errorMessage: options?.errorMessage,
    metadata: options?.metadata,
  };

  const validation = validateEvent(event);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.error}`);
  }

  emitEvent(event);
}

export function emitConsolidation(
  consolidationId: string,
  sourceDocIds: string[],
  targetDocId: string,
  mergeStrategy: "semantic" | "structural" | "manual",
  status: "initiated" | "in_progress" | "success" | "failed",
  options?: {
    duration?: number;
    conflictCount?: number;
    metadata?: ConsolidationEvent["metadata"];
  }
): void {
  const event: ConsolidationEvent = {
    schemaVersion: "1.0.0",
    type: "consolidation",
    timestamp: Date.now(),
    sequenceId: ++sequenceCounter,
    consolidationId,
    sourceDocIds,
    targetDocId,
    status,
    duration: options?.duration,
    mergeStrategy,
    conflictCount: options?.conflictCount,
    metadata: options?.metadata,
  };

  const validation = validateEvent(event);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.error}`);
  }

  emitEvent(event);
}

function emitEvent(event: DocsManagerEvent): void {
  try {
    ensureJsonlDir();

    const line = JSON.stringify(event);
    fs.appendFileSync(JSONL_PATH, line + "\n", "utf8");

    // Also write individual JSON files per spec
    ensureOutDir();
    const typeMap: Record<string, string> = {
      audit: "audit.json",
      drift: "drift.json",
      sync: "sync.json",
      consolidation: "consolidation.json",
    };

    const file = path.join(OUT_DIR, typeMap[event.type]);
    fs.writeFileSync(file, JSON.stringify(event, null, 2), "utf8");

    sequenceCounter = event.sequenceId;
  } catch (err) {
    console.error(`Failed to emit docs-manager event: ${err}`);
    throw err;
  }
}

// === Utilities ===

export function getSequenceCounter(): number {
  return sequenceCounter;
}

export function resetSequenceCounter(): void {
  sequenceCounter = 0;
}
