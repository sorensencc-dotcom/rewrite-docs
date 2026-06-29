/**
 * Unified Lineage Adapter (Phase 5)
 * Non-blocking integration between SkillLineage, LineageRegistry, and unified PostgreSQL graph.
 * Fracture 7: Connect disconnected lineage systems via lineage_events + lineage_edges.
 */

import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";

export interface LineageEvent {
  event_type:
    | "submit"
    | "validate"
    | "canary_start"
    | "violation"
    | "retry"
    | "rollback"
    | "abort"
    | "promote";
  source_system: "governance" | "build" | "sandbox";
  entity_id: string;
  entity_type: string;
  payload?: Record<string, any>;
}

export interface LineageEdge {
  parent_event_id: number;
  child_event_id: number;
  edge_type: "caused_by" | "preceded_by" | "rolled_back_to";
}

/**
 * Record a lineage event to the unified PostgreSQL graph.
 * Non-fatal: Postgres failures do not throw, logged only.
 */
export async function recordUnifiedEvent(event: LineageEvent): Promise<number | null> {
  try {
    const result = await pgQuery(
      `INSERT INTO lineage_events (event_type, source_system, entity_id, entity_type, payload, recorded_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id`,
      [
        event.event_type,
        event.source_system,
        event.entity_id,
        event.entity_type,
        event.payload ? JSON.stringify(event.payload) : null,
      ]
    );

    return result.length > 0 ? (result[0].id as number) : null;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "unknown error";
    console.error("[unified-lineage] non-fatal event write failure:", errorMsg);
    // Do not rethrow — lineage failures must not block canary execution
    return null;
  }
}

/**
 * Record an edge in the unified lineage graph.
 * Non-fatal: failures do not throw.
 */
export async function recordUnifiedEdge(edge: LineageEdge): Promise<void> {
  try {
    await pgQuery(
      `INSERT INTO lineage_edges (parent_event_id, child_event_id, edge_type, recorded_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [edge.parent_event_id, edge.child_event_id, edge.edge_type]
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "unknown error";
    console.error("[unified-lineage] non-fatal edge write failure:", errorMsg);
    // Do not rethrow — lineage failures must not block canary execution
  }
}

/**
 * Adapter for SkillLineage: writes governance events to unified lineage.
 * Called from SkillLineage.record() after inserting to MySQL.
 */
export async function recordGovernanceLineageEvent(
  skillId: string,
  event_type: "submit" | "validate" | "promote",
  payload: Record<string, any>
): Promise<void> {
  await recordUnifiedEvent({
    event_type,
    source_system: "governance",
    entity_id: skillId,
    entity_type: "skill",
    payload,
  });
}

/**
 * Adapter for LineageRegistry (build system): writes build events to unified lineage.
 * Called from build execution harness after artifact creation.
 */
export async function recordBuildLineageEvent(
  artifactId: string,
  event_type: "submit" | "validate" | "rollback" | "promote",
  payload: Record<string, any>
): Promise<void> {
  await recordUnifiedEvent({
    event_type,
    source_system: "build",
    entity_id: artifactId,
    entity_type: "artifact",
    payload,
  });
}

/**
 * Adapter for sandbox system: writes sandbox escalation events to unified lineage.
 * Called from sandbox violation handler.
 */
export async function recordSandboxLineageEvent(
  runId: string,
  event_type: "violation" | "abort" | "rollback",
  payload: Record<string, any>
): Promise<void> {
  await recordUnifiedEvent({
    event_type,
    source_system: "sandbox",
    entity_id: runId,
    entity_type: "sandbox_run",
    payload,
  });
}
