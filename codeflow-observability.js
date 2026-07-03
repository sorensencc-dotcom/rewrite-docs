// observability.js - Metrics and structured logging for CodeFlow analyzer
export class ObservabilityCollector {
  constructor() {
    this.metrics = {
      total_analyses: 0,
      successful_analyses: 0,
      failed_analyses: 0,
      total_duration_ms: 0,
      total_files_analyzed: 0
    };
  }

  recordAnalysis(result, duration) {
    this.metrics.total_analyses++;
    this.metrics.successful_analyses++;
    this.metrics.total_duration_ms += duration;
    this.metrics.total_files_analyzed += result.files.length;

    return {
      timestamp: new Date().toISOString(),
      event: "analysis_complete",
      duration_ms: duration,
      files: result.files.length,
      edges: result.edges.length,
      security_findings: result.security.length,
      patterns: result.patterns.length,
      blast_radius: result.blastRadius.length
    };
  }

  recordError(error, repoPath) {
    this.metrics.failed_analyses++;
    return {
      timestamp: new Date().toISOString(),
      event: "analysis_failed",
      repo_path: repoPath,
      error_message: error instanceof Error ? error.message : String(error),
      error_type: error?.constructor?.name || "Unknown"
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      avg_duration_ms: this.metrics.successful_analyses > 0
        ? Math.round(this.metrics.total_duration_ms / this.metrics.successful_analyses)
        : 0,
      success_rate: this.metrics.total_analyses > 0
        ? (this.metrics.successful_analyses / this.metrics.total_analyses * 100).toFixed(2) + "%"
        : "N/A",
      avg_files_per_analysis: this.metrics.successful_analyses > 0
        ? Math.round(this.metrics.total_files_analyzed / this.metrics.successful_analyses)
        : 0
    };
  }

  logStructured(entry) {
    console.log(JSON.stringify(entry, null, 2));
  }
}

export function createObserver() {
  return new ObservabilityCollector();
}
