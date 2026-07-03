// policy-engine.ts - Evaluates policy manifest rules against impact tags
import YAML from "yaml";
import fs from "fs";

export type Adoption = "must-adopt" | "optional";
export type RoadmapItemState = "candidate" | "approved" | "active" | "rejected";

export interface PolicyRule {
  match: string;
  adoption: Adoption;
  blocking: boolean;
  deadline: string | null;
  reason: string;
}

export interface PolicyManifest {
  version: number;
  repos: Record<string, PolicyRule[]>;
  global_rules: PolicyRule[];
  release_gates: ReleaseGate[];
  drift_thresholds: DriftThresholds;
}

export interface ReleaseGate {
  name: string;
  description: string;
  check: string; // SQL query or logic expression
  fail_if: string; // e.g., "> 0"
  message: string; // e.g., "Release blocked: {count} must-adopt blocking items pending"
}

export interface DriftThresholds {
  missing_edges: number;
  missing_security: number;
  missing_patterns: number;
  drift_age_hours: number;
}

export interface PolicyEvaluation {
  repoId: string;
  impactTag: string;
  matchedRules: PolicyRule[];
  adoption: Adoption;
  blocking: boolean;
  deadline: string | null;
  reason: string;
}

export class PolicyEngine {
  private manifest: PolicyManifest;

  constructor(manifestPath: string) {
    const yaml = fs.readFileSync(manifestPath, "utf-8");
    this.manifest = YAML.parse(yaml);
  }

  /**
   * Evaluate impact tags against policy manifest
   */
  evaluate(repoId: string, impactTag: string): PolicyEvaluation {
    const repoRules = this.manifest.repos[repoId] || [];
    const allRules = [...repoRules, ...this.manifest.global_rules];

    // Find matching rules
    const matchedRules = allRules.filter((rule) => this.matchesPattern(impactTag, rule.match));

    if (matchedRules.length === 0) {
      // No explicit rule → default to optional
      return {
        repoId,
        impactTag,
        matchedRules: [],
        adoption: "optional",
        blocking: false,
        deadline: null,
        reason: "No matching policy rule (defaults to optional)"
      };
    }

    // Global security rule overrides everything
    const isSecurityIssue = /security/.test(impactTag);
    if (isSecurityIssue && this.manifest.global_rules.some((r) => /security/.test(r.match))) {
      const securityRule = this.manifest.global_rules.find((r) => /security/.test(r.match))!;
      return {
        repoId,
        impactTag,
        matchedRules: [securityRule],
        adoption: "must-adopt",
        blocking: true,
        deadline: securityRule.deadline,
        reason: securityRule.reason
      };
    }

    // Use most restrictive rule (must-adopt > optional, blocking > non-blocking)
    const mostRestrictive = matchedRules.reduce((acc, rule) => {
      if (rule.adoption === "must-adopt" && acc.adoption === "optional") return rule;
      if (rule.blocking && !acc.blocking) return rule;
      return acc;
    });

    return {
      repoId,
      impactTag,
      matchedRules,
      adoption: mostRestrictive.adoption,
      blocking: mostRestrictive.blocking,
      deadline: mostRestrictive.deadline,
      reason: mostRestrictive.reason
    };
  }

  /**
   * Check if impact tag matches rule pattern (simple glob-like matching)
   */
  private matchesPattern(tag: string, pattern: string): boolean {
    if (pattern === tag) return true;
    if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      return tag.startsWith(prefix);
    }
    // Regex fallback
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    return regex.test(tag);
  }

  /**
   * Evaluate if release is blocked
   */
  getReleaseBlocker(blockingItems: RoadmapItem[]): { blocked: boolean; reason: string } {
    const mustAdoptBlocking = blockingItems.filter(
      (item) => item.policy === "must-adopt" && item.blocking && item.state !== "active"
    );

    if (mustAdoptBlocking.length > 0) {
      return {
        blocked: true,
        reason: `Release blocked: ${mustAdoptBlocking.length} must-adopt blocking items pending. Items: ${mustAdoptBlocking.map((i) => i.id).join(", ")}`
      };
    }

    return {
      blocked: false,
      reason: "All required items active. Release approved."
    };
  }
}

export interface RoadmapItem {
  id: string;
  repoId: string;
  type: "todo" | "idea";
  title: string;
  priority: "high" | "medium" | "low";
  status: string;
  state: RoadmapItemState;
  policy: Adoption;
  blocking: boolean;
  deadline: string | null;
  reason: string;
  commit_sha: string;
  created_at: string;
  updated_at: string;
}

/**
 * Apply policy evaluation to create a roadmap item
 */
export function createPolicyItem(
  repoId: string,
  commitSha: string,
  impactTag: string,
  policyEval: PolicyEvaluation
): Partial<RoadmapItem> {
  return {
    repoId,
    commit_sha: commitSha,
    policy: policyEval.adoption,
    blocking: policyEval.blocking,
    deadline: policyEval.deadline,
    reason: policyEval.reason,
    state: "candidate", // New items start as candidates
    created_at: new Date().toISOString()
  };
}
