// cic-observability.ts
// Integration with CIC's telemetry system for CodeFlow extraction metrics

import type { ExtractorResult } from "./extractor-orchestrator";

// Placeholder for CIC telemetry imports
// In production, this would import from @cic/telemetry
interface MetricsCollector {
  counter(name: string): { inc(labels?: Record<string, string>): void };
  gauge(name: string): { set(value: number, labels?: Record<string, string>): void };
  histogram(name: string): { observe(value: number, labels?: Record<string, string>): void };
}

interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

// Mock implementation (replace with real CIC telemetry in production)
class MockMetrics implements MetricsCollector {
  counter(name: string) {
    return {
      inc: (labels?: Record<string, string>) => {
        console.log(`[METRIC] ${name} ${JSON.stringify(labels || {})}`);
      }
    };
  }

  gauge(name: string) {
    return {
      set: (value: number, labels?: Record<string, string>) => {
        console.log(`[METRIC] ${name}=${value} ${JSON.stringify(labels || {})}`);
      }
    };
  }

  histogram(name: string) {
    return {
      observe: (value: number, labels?: Record<string, string>) => {
        console.log(`[METRIC] ${name} ${value}ms ${JSON.stringify(labels || {})}`);
      }
    };
  }
}

class MockLogger implements Logger {
  info(message: string, context?: Record<string, unknown>) {
    console.log(`[INFO] ${message}`, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    console.error(`[ERROR] ${message}`, context);
  }
}

// Singleton instances
const metrics: MetricsCollector = new MockMetrics();
const logger: Logger = new MockLogger();

// ============================================================================
// METRIC RECORDING
// ============================================================================

export function recordExtractorMetrics(repoId: string, result: ExtractorResult): void {
  // Counter: total extraction runs
  metrics.counter("cic_extractor_runs_total").inc({ repo_id: repoId, status: result.status });

  // Gauge: extracted counts
  metrics.gauge("cic_extractor_nodes").set(result.extracted.nodes, { repo_id: repoId });
  metrics.gauge("cic_extractor_edges").set(result.extracted.edges, { repo_id: repoId });
  metrics.gauge("cic_extractor_security_issues").set(result.extracted.security, { repo_id: repoId });
  metrics.gauge("cic_extractor_patterns").set(result.extracted.patterns, { repo_id: repoId });
  metrics.gauge("cic_extractor_impact_entries").set(result.extracted.impact, { repo_id: repoId });

  // Histogram: extraction duration
  metrics.histogram("cic_extractor_duration_ms").observe(result.duration_ms, { repo_id: repoId });
}

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

interface ExtractorLogEntry {
  timestamp?: string;
  event: string;
  repo_id?: string;
  repo_path?: string;
  duration_ms?: number;
  error_message?: string;
  error_type?: string;
  extracted?: {
    nodes: number;
    edges: number;
    security: number;
    patterns: number;
    impact: number;
  };
  [key: string]: unknown;
}

export function recordExtractorLog(repoId: string, entry: Omit<ExtractorLogEntry, "repo_id">): void {
  const logEntry: ExtractorLogEntry = {
    timestamp: new Date().toISOString(),
    repo_id: repoId,
    ...entry
  };

  switch (entry.event) {
    case "extraction_started":
      logger.info("Extraction started", logEntry);
      break;
    case "extraction_complete":
      logger.info("Extraction complete", logEntry);
      break;
    case "extraction_failed":
      logger.error("Extraction failed", logEntry);
      break;
    default:
      logger.info(`Extractor event: ${entry.event}`, logEntry);
  }
}

// ============================================================================
// DASHBOARD INTEGRATION
// ============================================================================

export interface DashboardMetrics {
  total_extractions: number;
  successful_extractions: number;
  failed_extractions: number;
  total_nodes_extracted: number;
  total_edges_extracted: number;
  total_security_issues: number;
  total_patterns: number;
  avg_duration_ms: number;
  by_repo: Record<string, RepoMetrics>;
}

export interface RepoMetrics {
  extraction_count: number;
  success_count: number;
  failure_count: number;
  last_extraction: string;
  nodes: number;
  edges: number;
  security_issues: number;
  patterns: number;
}

// In-memory aggregator (replace with real CIC metrics query in production)
const extractionStats = new Map<string, { count: number; success: number; failure: number; lastTime: Date }>();

export function trackExtraction(repoId: string, success: boolean): void {
  const stats = extractionStats.get(repoId) || { count: 0, success: 0, failure: 0, lastTime: new Date() };
  stats.count++;
  if (success) {
    stats.success++;
  } else {
    stats.failure++;
  }
  stats.lastTime = new Date();
  extractionStats.set(repoId, stats);
}

export function getDashboardMetrics(): DashboardMetrics {
  const byRepo: Record<string, RepoMetrics> = {};

  let totalCount = 0;
  let totalSuccess = 0;
  let totalFailure = 0;

  for (const [repoId, stats] of extractionStats.entries()) {
    totalCount += stats.count;
    totalSuccess += stats.success;
    totalFailure += stats.failure;
    byRepo[repoId] = {
      extraction_count: stats.count,
      success_count: stats.success,
      failure_count: stats.failure,
      last_extraction: stats.lastTime.toISOString(),
      nodes: 0, // Would be populated from metrics store
      edges: 0,
      security_issues: 0,
      patterns: 0
    };
  }

  return {
    total_extractions: totalCount,
    successful_extractions: totalSuccess,
    failed_extractions: totalFailure,
    total_nodes_extracted: 0, // Populated from metrics
    total_edges_extracted: 0,
    total_security_issues: 0,
    total_patterns: 0,
    avg_duration_ms: 0,
    by_repo: byRepo
  };
}

// ============================================================================
// ALERT CONDITIONS
// ============================================================================

export interface AlertCondition {
  id: string;
  name: string;
  threshold: number;
  operator: ">" | "<" | "==" | "!=";
  metric: string;
  enabled: boolean;
}

const alertConditions: AlertCondition[] = [
  {
    id: "high_security_findings",
    name: "High Security Issue Count",
    metric: "cic_extractor_security_issues",
    threshold: 10,
    operator: ">",
    enabled: true
  },
  {
    id: "slow_extraction",
    name: "Slow Extraction Duration",
    metric: "cic_extractor_duration_ms",
    threshold: 30000, // 30 seconds
    operator: ">",
    enabled: true
  },
  {
    id: "extraction_failure_rate",
    name: "High Extraction Failure Rate",
    metric: "extraction_failure_rate",
    threshold: 0.1, // 10%
    operator: ">",
    enabled: true
  }
];

export function checkAlerts(repoId: string, result: ExtractorResult): string[] {
  const alerts: string[] = [];

  for (const condition of alertConditions) {
    if (!condition.enabled) continue;

    let value: number | undefined;

    switch (condition.metric) {
      case "cic_extractor_security_issues":
        value = result.extracted.security;
        break;
      case "cic_extractor_duration_ms":
        value = result.duration_ms;
        break;
    }

    if (value !== undefined && shouldAlert(value, condition.threshold, condition.operator)) {
      alerts.push(`${condition.name}: ${value} ${condition.operator} ${condition.threshold}`);
    }
  }

  return alerts;
}

function shouldAlert(value: number, threshold: number, operator: string): boolean {
  switch (operator) {
    case ">":
      return value > threshold;
    case "<":
      return value < threshold;
    case "==":
      return value === threshold;
    case "!=":
      return value !== threshold;
    default:
      return false;
  }
}

export function emitAlerts(repoId: string, alerts: string[]): void {
  if (alerts.length === 0) return;

  for (const alert of alerts) {
    logger.warn(`ALERT for ${repoId}: ${alert}`);
  }
}
