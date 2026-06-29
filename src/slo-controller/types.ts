/**
 * SLO Controller Types
 * Workstream B: SLO Controller + Prometheus Integration
 */

export interface SLORule {
  id: string;
  name: string;
  metric: string;
  target: number;
  window: "1m" | "5m" | "30m";
  burnRateThreshold: number;
}

export interface Metrics {
  [key: string]: number;
}

export interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
}

export interface ErrorRateMetrics {
  total: number;
  failed: number;
  rate: number;
}

export interface SaturationMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  connectionCount: number;
}

export interface BurnRateResult {
  sloId: string;
  currentBurnRate: number;
  threshold: number;
  isViolating: boolean;
  remainingBudget: number;
  estimatedBudgetExhaustion: number | null;
}

export interface SLOViolationEvent {
  timestamp: Date | number;
  sloId: string;
  metric: string;
  value: number;
  threshold: number;
  burnRate: number;
  severity: "warning" | "critical";
}
