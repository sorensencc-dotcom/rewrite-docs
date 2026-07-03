// drift-detector.ts - Detect when CIC lags behind CodeFlow analysis
import type { CodeFlowResult } from "./codeflow-extractor";

export interface CicSnapshot {
  nodes: { path: string; size: number }[];
  edges: { from: string; to: string; kind: string }[];
  security: { file: string; line: number; category: string; severity: string }[];
  patterns: { file: string; line: number; pattern: string }[];
  impact: { file: string; affectedFiles: string[] }[];
}

export interface DriftAnalysis {
  repoId: string;
  isDrifting: boolean;
  severity: "none" | "low" | "medium" | "high" | "critical";
  missingEdges: { from: string; to: string }[];
  missingSecurity: { file: string; line: number; type: string; severity: string }[];
  missingPatterns: { file: string; line: number; type: string }[];
  missingImpact: { file: string; affectedFiles: string[] }[];
  metrics: {
    edges_missing: number;
    edges_total: number;
    edges_coverage: number;
    security_missing: number;
    security_total: number;
    security_coverage: number;
    patterns_missing: number;
    patterns_total: number;
    patterns_coverage: number;
  };
  firstDetectedAt: string;
  lastDetectedAt: string;
  driftAgeHours: number;
}

/**
 * Compute drift between CodeFlow analysis and CIC snapshot
 */
export function analyzeDrift(
  repoId: string,
  codeflow: CodeFlowResult,
  cic: CicSnapshot,
  thresholds: {
    missing_edges: number;
    missing_security: number;
    missing_patterns: number;
    drift_age_hours: number;
  }
): DriftAnalysis {
  const timestamp = new Date().toISOString();

  // Compare edges
  const cicEdgeSet = new Set(cic.edges.map((e) => `${e.from}→${e.to}`));
  const missingEdges = codeflow.edges.filter((e) => !cicEdgeSet.has(`${e.from}→${e.to}`));

  // Compare security findings
  const cicSecuritySet = new Set(
    cic.security.map((s) => `${s.file}:${s.line}:${s.category}`)
  );
  const missingSecurity = codeflow.security.filter(
    (s) => !cicSecuritySet.has(`${s.file}:${s.line}:${s.type}`)
  );

  // Compare patterns
  const cicPatternSet = new Set(cic.patterns.map((p) => `${p.file}:${p.line}:${p.pattern}`));
  const missingPatterns = codeflow.patterns.filter(
    (p) => !cicPatternSet.has(`${p.file}:${p.line}:${p.type}`)
  );

  // Compare impact (blast radius)
  const cicImpactFiles = new Set(cic.impact.map((i) => i.file));
  const missingImpact = codeflow.blastRadius.filter((b) => !cicImpactFiles.has(b.file));

  // Calculate coverage metrics
  const edgesCoverage = codeflow.edges.length > 0 ?
    ((codeflow.edges.length - missingEdges.length) / codeflow.edges.length * 100) : 100;
  const securityCoverage = codeflow.security.length > 0 ?
    ((codeflow.security.length - missingSecurity.length) / codeflow.security.length * 100) : 100;
  const patternsCoverage = codeflow.patterns.length > 0 ?
    ((codeflow.patterns.length - missingPatterns.length) / codeflow.patterns.length * 100) : 100;

  // Determine severity
  const severity = determineSeverity(missingEdges, missingSecurity, missingPatterns, thresholds);
  const isDrifting = severity !== "none";

  return {
    repoId,
    isDrifting,
    severity,
    missingEdges,
    missingSecurity,
    missingPatterns,
    missingImpact,
    metrics: {
      edges_missing: missingEdges.length,
      edges_total: codeflow.edges.length,
      edges_coverage: Math.round(edgesCoverage),
      security_missing: missingSecurity.length,
      security_total: codeflow.security.length,
      security_coverage: Math.round(securityCoverage),
      patterns_missing: missingPatterns.length,
      patterns_total: codeflow.patterns.length,
      patterns_coverage: Math.round(patternsCoverage)
    },
    firstDetectedAt: timestamp,
    lastDetectedAt: timestamp,
    driftAgeHours: 0
  };
}

/**
 * Determine severity level based on missing counts and thresholds
 */
function determineSeverity(
  missingEdges: any[],
  missingSecurity: any[],
  missingPatterns: any[],
  thresholds: {
    missing_edges: number;
    missing_security: number;
    missing_patterns: number;
  }
): "none" | "low" | "medium" | "high" | "critical" {
  const edgesMissing = missingEdges.length > thresholds.missing_edges;
  const securityMissing = missingSecurity.length > thresholds.missing_security;
  const patternsMissing = missingPatterns.length > thresholds.missing_patterns;

  // Critical: security issues are missing
  if (securityMissing) {
    return "critical";
  }

  // High: both edges and patterns missing
  if (edgesMissing && patternsMissing) {
    return "high";
  }

  // Medium: edges or patterns missing
  if (edgesMissing || patternsMissing) {
    return "medium";
  }

  // Low: minor missing items
  if (missingEdges.length > 0 || missingSecurity.length > 0 || missingPatterns.length > 0) {
    return "low";
  }

  return "none";
}

/**
 * Format drift analysis for logging
 */
export function formatDriftReport(drift: DriftAnalysis): string {
  const lines = [
    `=== Drift Analysis: ${drift.repoId} ===`,
    `Status: ${drift.isDrifting ? "DRIFTING" : "IN SYNC"}`,
    `Severity: ${drift.severity.toUpperCase()}`,
    ``,
    `Coverage:`,
    `  Edges:     ${drift.metrics.edges_coverage}% (${drift.metrics.edges_total - drift.metrics.edges_missing}/${drift.metrics.edges_total})`,
    `  Security:  ${drift.metrics.security_coverage}% (${drift.metrics.security_total - drift.metrics.security_missing}/${drift.metrics.security_total})`,
    `  Patterns:  ${drift.metrics.patterns_coverage}% (${drift.metrics.patterns_total - drift.metrics.patterns_missing}/${drift.metrics.patterns_total})`,
    ``
  ];

  if (drift.missingSecurity.length > 0) {
    lines.push(`⚠️  Missing Security Findings (${drift.missingSecurity.length}):`);
    drift.missingSecurity.slice(0, 5).forEach((s) => {
      lines.push(`    ${s.file}:${s.line} — ${s.type} [${s.severity}]`);
    });
    if (drift.missingSecurity.length > 5) {
      lines.push(`    ... and ${drift.missingSecurity.length - 5} more`);
    }
    lines.push(``);
  }

  if (drift.missingEdges.length > 0) {
    lines.push(`Missing Edges (${drift.missingEdges.length}):`);
    drift.missingEdges.slice(0, 5).forEach((e) => {
      lines.push(`    ${e.from} → ${e.to}`);
    });
    if (drift.missingEdges.length > 5) {
      lines.push(`    ... and ${drift.missingEdges.length - 5} more`);
    }
    lines.push(``);
  }

  lines.push(`Last detected: ${drift.lastDetectedAt}`);

  return lines.join("\n");
}

/**
 * Should drift trigger a roadmap item?
 */
export function shouldCreateDriftItem(drift: DriftAnalysis): boolean {
  // Create items for medium+ severity
  return drift.severity === "high" || drift.severity === "critical";
}

/**
 * Create a drift roadmap item
 */
export function createDriftItem(drift: DriftAnalysis, commitSha: string) {
  const severityEmoji = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🔵",
    none: "✓"
  };

  return {
    type: "todo" as const,
    title: `${severityEmoji[drift.severity]} Drift: ${drift.repoId} behind CodeFlow`,
    description: formatDriftReport(drift),
    priority: drift.severity === "critical" ? "high" : "medium",
    tags: ["drift", `drift-${drift.severity}`, drift.repoId],
    commit_sha: commitSha,
    policy: drift.severity === "critical" ? "must-adopt" : "optional",
    blocking: drift.severity === "critical",
    reason: `CIC analysis is ${drift.severity} drift from CodeFlow. ${drift.metrics.edges_missing} edges, ${drift.metrics.security_missing} security issues, ${drift.metrics.patterns_missing} patterns missing.`
  };
}
