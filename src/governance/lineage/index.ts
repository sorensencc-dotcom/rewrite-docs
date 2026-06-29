import { AuditResult, GovernanceContext, Skill, ISO8601 } from "../models";

export interface Database {
  insert(table: string, data: Record<string, unknown>): Promise<void>;
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

export class SkillLineage {
  constructor(private db: Database) {}

  async record(skill: Skill, audit: AuditResult, ctx: GovernanceContext): Promise<void> {
    const policyIds = audit.policies_triggered.map((p) => p.id);

    // Determine row-level severity: highest severity across all triggered policies
    const severityOrder = { low: 1, medium: 2, high: 3 };
    const maxSeverity = audit.policies_triggered.length > 0
      ? audit.policies_triggered.reduce((max, p) => {
          const sev = (severityOrder as any)[p.severity] || 1;
          return sev > (severityOrder as any)[max] ? p.severity : max;
        }, "low" as "low" | "medium" | "high")
      : "medium";

    // Determine row-level category: first category from triggered policies
    const category = audit.policies_triggered.length > 0
      ? audit.policies_triggered[0].category
      : "governance";

    await this.db.insert("skill_lineage", {
      skill_id: skill.meta.id,
      skill_name: skill.meta.name,
      skill_version: skill.meta.version,
      source: ctx.source,
      audit_verdict: audit.verdict,
      policies_triggered: JSON.stringify(policyIds),
      risk_score: audit.risk_score,
      severity: maxSeverity,
      category,
      policy_metadata: JSON.stringify(audit.policies_triggered),
      audit_timestamp: audit.audit_timestamp,
      auditor_model: audit.auditor_model,
      policy_version: audit.policy_version,
      recorded_at: new Date().toISOString(),
    });
  }

  async getAuditChain(skillId: string): Promise<AuditResult[]> {
    const rows = await this.db.query(
      `SELECT * FROM skill_lineage WHERE skill_id = ? ORDER BY audit_timestamp ASC`,
      [skillId]
    );

    return rows.map((row) => this.rowToAuditResult(row));
  }

  async queryByPolicy(
    policyId: string,
    timeRange?: { start: ISO8601; end: ISO8601 }
  ): Promise<string[]> {
    let query = `SELECT DISTINCT skill_id FROM skill_lineage WHERE policies_triggered LIKE ?`;
    const params: unknown[] = [`%${policyId}%`];

    if (timeRange) {
      query += ` AND audit_timestamp BETWEEN ? AND ?`;
      params.push(timeRange.start, timeRange.end);
    }

    const rows = await this.db.query(query, params);
    return rows.map((r) => r.skill_id as string);
  }

  async detectDrift(
    skillId: string
  ): Promise<{
    has_drift: boolean;
    drift_timeline: {
      audit_timestamp: ISO8601;
      policies_added: string[];
      policies_removed: string[];
      risk_delta: number;
    }[];
  }> {
    const chain = await this.getAuditChain(skillId);

    const drift_timeline = [];
    for (let i = 1; i < chain.length; i++) {
      const prev = chain[i - 1];
      const curr = chain[i];

      const prev_policies = new Set(prev.policies_triggered.map((p) => p.id));
      const curr_policies = new Set(curr.policies_triggered.map((p) => p.id));

      const added = [...curr_policies].filter((p) => !prev_policies.has(p));
      const removed = [...prev_policies].filter((p) => !curr_policies.has(p));

      if (added.length > 0 || removed.length > 0) {
        drift_timeline.push({
          audit_timestamp: curr.audit_timestamp,
          policies_added: added,
          policies_removed: removed,
          risk_delta: curr.risk_score - prev.risk_score,
        });
      }
    }

    return {
      has_drift: drift_timeline.length > 0,
      drift_timeline,
    };
  }

  private rowToAuditResult(row: Record<string, unknown>): AuditResult {
    // Reconstruct AuditResult from database row
    // Try to use stored policy_metadata first; fall back to policy IDs
    let policies_triggered = [];
    if (row.policy_metadata) {
      try {
        policies_triggered = JSON.parse(row.policy_metadata as string);
      } catch (e) {
        // If policy_metadata parsing fails, fall back to policy IDs
        if (row.policies_triggered) {
          try {
            const policyIds = JSON.parse(row.policies_triggered as string);
            policies_triggered = policyIds.map((id: string) => ({
              id,
              description: "Policy from lineage",
              severity: (row.severity as "low" | "medium" | "high") ?? "medium",
              category: (row.category as "injection" | "safety" | "completeness" | "scope") ?? "governance",
              reaudit_interval_days: 90,
              examples: { pass: [], fail: [] },
            }));
          } catch (e2) {
            policies_triggered = [];
          }
        }
      }
    } else if (row.policies_triggered) {
      try {
        const policyIds = JSON.parse(row.policies_triggered as string);
        policies_triggered = policyIds.map((id: string) => ({
          id,
          description: "Policy from lineage",
          severity: (row.severity as "low" | "medium" | "high") ?? "medium",
          category: (row.category as "injection" | "safety" | "completeness" | "scope") ?? "governance",
          reaudit_interval_days: 90,
          examples: { pass: [], fail: [] },
        }));
      } catch (e) {
        policies_triggered = [];
      }
    }

    return {
      skill_id: row.skill_id as string,
      skill_name: row.skill_name as string,
      skill_version: row.skill_version as string,
      source: row.source as "AbsolutelySkilled" | "Local" | "Internal",
      verdict: row.audit_verdict as "PASS" | "WARN" | "FAIL",
      policies_triggered,
      risk_score: row.risk_score as number,
      deterministic_flags: [],
      audit_timestamp: row.audit_timestamp as ISO8601,
      auditor_model: row.auditor_model as "deterministic" | "semantic",
      policy_version: row.policy_version as string,
      audit_duration_ms: 0,
      notes: [],
    };
  }
}
