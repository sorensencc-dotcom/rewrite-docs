/**
 * Unified Lineage Adapter (Phase 5)
 * Non-blocking integration between SkillLineage, LineageRegistry, and unified PostgreSQL graph.
 * Fracture 7: Connect disconnected lineage systems via lineage_events + lineage_edges.
 */
export interface LineageEvent {
    event_type: "submit" | "validate" | "canary_start" | "violation" | "retry" | "rollback" | "abort" | "promote";
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
export declare function recordUnifiedEvent(event: LineageEvent): Promise<number | null>;
/**
 * Record an edge in the unified lineage graph.
 * Non-fatal: failures do not throw.
 */
export declare function recordUnifiedEdge(edge: LineageEdge): Promise<void>;
/**
 * Adapter for SkillLineage: writes governance events to unified lineage.
 * Called from SkillLineage.record() after inserting to MySQL.
 */
export declare function recordGovernanceLineageEvent(skillId: string, event_type: "submit" | "validate" | "promote", payload: Record<string, any>): Promise<void>;
/**
 * Adapter for LineageRegistry (build system): writes build events to unified lineage.
 * Called from build execution harness after artifact creation.
 */
export declare function recordBuildLineageEvent(artifactId: string, event_type: "submit" | "validate" | "rollback" | "promote", payload: Record<string, any>): Promise<void>;
/**
 * Adapter for sandbox system: writes sandbox escalation events to unified lineage.
 * Called from sandbox violation handler.
 */
export declare function recordSandboxLineageEvent(runId: string, event_type: "violation" | "abort" | "rollback", payload: Record<string, any>): Promise<void>;
//# sourceMappingURL=unified-lineage.d.ts.map