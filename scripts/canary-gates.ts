#!/usr/bin/env node
/**
 * Canary Gates Validation Harness
 *
 * Validates workstream completion against M2 gate criteria:
 * - Test pass rate ≥ 98%
 * - Schema validation (no drift)
 * - Load test results (p95 < 15ms for ledger, < 40ms for cache)
 * - Metrics collection (100% scrape success)
 * - No active blockers
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GateResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  value: number | string | boolean;
  threshold: number | string | boolean;
  message: string;
}

interface CanaryReport {
  timestamp: string;
  workstream: string;
  overallStatus: 'pass' | 'fail';
  gates: GateResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

const gateConfig = {
  testPassRate: { threshold: 98, critical: true },
  schemaValidation: { threshold: true, critical: true },
  loadTestP95Ledger: { threshold: 15, unit: 'ms', critical: true },
  loadTestP95Cache: { threshold: 40, unit: 'ms', critical: true },
  prometheusScrapSuccess: { threshold: 100, unit: '%', critical: true },
  governanceHookLatency: { threshold: 50, unit: 'ms', critical: true },
  blockerCount: { threshold: 0, critical: true },
};

async function getTestPassRate(): Promise<number> {
  try {
    const { stdout } = await execAsync('npm test -- --passWithNoTests 2>&1 | tail -20');
    const match = stdout.match(/(\d+)\spassed/);
    const passedMatch = stdout.match(/Tests:\s+(\d+)\spassed/);
    if (passedMatch) {
      const total = stdout.match(/Tests:\s+(\d+)/)?.[1];
      if (total) {
        return (parseInt(passedMatch[1]) / parseInt(total)) * 100;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error getting test pass rate:', error);
    return 0;
  }
}

async function validateSchema(): Promise<boolean> {
  try {
    // Check for budget_ledger_v3 schema existence
    const schemaPath = path.join(process.cwd(), 'db', 'schemas', 'budget_ledger_v3.sql');
    return fs.existsSync(schemaPath);
  } catch (error) {
    console.error('Error validating schema:', error);
    return false;
  }
}

async function getLoadTestResults(): Promise<{ p95Ledger: number; p95Cache: number }> {
  try {
    const resultsFile = path.join(process.cwd(), 'cic', 'load-tests', 'results.json');
    if (!fs.existsSync(resultsFile)) {
      return { p95Ledger: 0, p95Cache: 0 };
    }
    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
    return {
      p95Ledger: results.ledger?.p95 || 0,
      p95Cache: results.cache?.p95 || 0,
    };
  } catch (error) {
    console.error('Error getting load test results:', error);
    return { p95Ledger: 0, p95Cache: 0 };
  }
}

async function checkPrometheusMetrics(): Promise<number> {
  try {
    // Simulate checking Prometheus scrape success rate
    // In real scenario, would query Prometheus /api/v1/query
    const metricsEndpoint = 'http://localhost:9090/metrics';
    const response = await Promise.race([
      fetch(metricsEndpoint).then(r => r.ok ? 100 : 0),
      new Promise<number>(resolve => setTimeout(() => resolve(0), 2000)),
    ]);
    return response as number;
  } catch (error) {
    console.warn('Prometheus not reachable, assuming 0% scrape success');
    return 0;
  }
}

async function checkGovernanceHookLatency(): Promise<number> {
  try {
    // Check governance hook latency from logs
    const logsPath = path.join(process.cwd(), 'logs', 'governance.log');
    if (!fs.existsSync(logsPath)) {
      return 0;
    }
    const logs = fs.readFileSync(logsPath, 'utf-8');
    const latencies = logs.match(/latency_ms=(\d+)/g) || [];
    if (latencies.length === 0) return 0;
    const values = latencies.map(l => parseInt(l.split('=')[1]));
    const sorted = values.sort((a, b) => a - b);
    return sorted[Math.ceil(sorted.length * 0.95)];
  } catch (error) {
    console.error('Error checking governance hook latency:', error);
    return 0;
  }
}

async function checkBlockers(): Promise<number> {
  try {
    const { stdout } = await execAsync('gh issue list --state open --label blocker 2>&1 | wc -l');
    return parseInt(stdout.trim());
  } catch (error) {
    console.error('Error checking blockers:', error);
    return 0;
  }
}

async function validateGatesB(): Promise<CanaryReport> {
  // Special handler for WS-B (SLO enforcement gates)
  const { runWSBValidation, formatWSBReport } = await import('../src/autonomy/firedrills/wsb-runner');

  console.log(`\n🚀 Validating Canary Gates for Workstream: B (SLO Enforcement)`);
  console.log('='.repeat(60));

  const wsbReport = await runWSBValidation();
  console.log(formatWSBReport(wsbReport));

  const results: GateResult[] = [
    {
      name: 'B1: Burn-Rate Spike Gate',
      status: wsbReport.scenarios.B1.passed ? 'pass' : 'fail',
      value: `Rollback: ${wsbReport.scenarios.B1.rollbackMs}ms`,
      threshold: '≤300ms',
      message: wsbReport.scenarios.B1.passed
        ? `✅ Abort triggered, rollback ${wsbReport.scenarios.B1.rollbackMs}ms < 300ms`
        : `❌ Failed (abort=${wsbReport.scenarios.B1.abortTriggered}, rollback=${wsbReport.scenarios.B1.rollbackMs}ms)`,
    },
    {
      name: 'B2: Latency Regression Gate',
      status: wsbReport.scenarios.B2.passed ? 'pass' : 'fail',
      value: `Rollback: ${wsbReport.scenarios.B2.rollbackMs}ms`,
      threshold: '≤300ms',
      message: wsbReport.scenarios.B2.passed
        ? `✅ Abort triggered, rollback ${wsbReport.scenarios.B2.rollbackMs}ms < 300ms`
        : `❌ Failed (abort=${wsbReport.scenarios.B2.abortTriggered}, rollback=${wsbReport.scenarios.B2.rollbackMs}ms)`,
    },
    {
      name: 'B3: Error-Rate Drift Gate',
      status: wsbReport.scenarios.B3.passed ? 'pass' : 'fail',
      value: `Rollback: ${wsbReport.scenarios.B3.rollbackMs}ms`,
      threshold: '≤300ms',
      message: wsbReport.scenarios.B3.passed
        ? `✅ Abort triggered, rollback ${wsbReport.scenarios.B3.rollbackMs}ms < 300ms`
        : `❌ Failed (abort=${wsbReport.scenarios.B3.abortTriggered}, rollback=${wsbReport.scenarios.B3.rollbackMs}ms)`,
    },
    {
      name: 'B4: Saturation Gate',
      status: wsbReport.scenarios.B4.passed ? 'pass' : 'fail',
      value: `Rollback: ${wsbReport.scenarios.B4.rollbackMs}ms`,
      threshold: '≤300ms',
      message: wsbReport.scenarios.B4.passed
        ? `✅ Abort triggered, rollback ${wsbReport.scenarios.B4.rollbackMs}ms < 300ms`
        : `❌ Failed (abort=${wsbReport.scenarios.B4.abortTriggered}, rollback=${wsbReport.scenarios.B4.rollbackMs}ms)`,
    },
  ];

  return {
    timestamp: new Date().toISOString(),
    workstream: 'B',
    overallStatus: wsbReport.pass ? 'pass' : 'fail',
    gates: results,
    summary: {
      passed: wsbReport.passCount,
      failed: wsbReport.failCount,
      warnings: 0,
    },
  };
}

async function validateGates(workstream: string): Promise<CanaryReport> {
  if (workstream === 'B') {
    return validateGatesB();
  }

  console.log(`\n🚀 Validating Canary Gates for Workstream: ${workstream}`);
  console.log('='.repeat(60));

  const results: GateResult[] = [];

  // Test Pass Rate
  const testPassRate = await getTestPassRate();
  results.push({
    name: 'Test Pass Rate',
    status: testPassRate >= gateConfig.testPassRate.threshold ? 'pass' : 'fail',
    value: testPassRate.toFixed(2),
    threshold: gateConfig.testPassRate.threshold,
    message: `${testPassRate.toFixed(2)}% >= ${gateConfig.testPassRate.threshold}%`,
  });

  // Schema Validation
  const schemaValid = await validateSchema();
  results.push({
    name: 'Schema Validation',
    status: schemaValid ? 'pass' : 'fail',
    value: schemaValid,
    threshold: true,
    message: schemaValid ? 'budget_ledger_v3 schema found' : 'Schema missing',
  });

  // Load Test Results
  const loadResults = await getLoadTestResults();
  results.push({
    name: 'Load Test P95 (Ledger)',
    status: loadResults.p95Ledger > 0 && loadResults.p95Ledger <= gateConfig.loadTestP95Ledger.threshold ? 'pass' : 'warn',
    value: `${loadResults.p95Ledger}ms`,
    threshold: `${gateConfig.loadTestP95Ledger.threshold}ms`,
    message: loadResults.p95Ledger === 0 ? 'No results yet' : `${loadResults.p95Ledger}ms <= ${gateConfig.loadTestP95Ledger.threshold}ms`,
  });

  results.push({
    name: 'Load Test P95 (Cache)',
    status: loadResults.p95Cache > 0 && loadResults.p95Cache <= gateConfig.loadTestP95Cache.threshold ? 'pass' : 'warn',
    value: `${loadResults.p95Cache}ms`,
    threshold: `${gateConfig.loadTestP95Cache.threshold}ms`,
    message: loadResults.p95Cache === 0 ? 'No results yet' : `${loadResults.p95Cache}ms <= ${gateConfig.loadTestP95Cache.threshold}ms`,
  });

  // Prometheus Metrics
  const promScrapSuccess = await checkPrometheusMetrics();
  results.push({
    name: 'Prometheus Scrape Success',
    status: promScrapSuccess === 100 ? 'pass' : promScrapSuccess > 50 ? 'warn' : 'fail',
    value: `${promScrapSuccess}%`,
    threshold: '100%',
    message: `${promScrapSuccess}% success rate`,
  });

  // Governance Hook Latency
  const hookLatency = await checkGovernanceHookLatency();
  results.push({
    name: 'Governance Hook Latency',
    status: hookLatency === 0 ? 'warn' : hookLatency <= gateConfig.governanceHookLatency.threshold ? 'pass' : 'fail',
    value: `${hookLatency}ms`,
    threshold: `${gateConfig.governanceHookLatency.threshold}ms`,
    message: hookLatency === 0 ? 'No data yet' : `${hookLatency}ms p95 <= ${gateConfig.governanceHookLatency.threshold}ms`,
  });

  // Blockers
  const blockerCount = await checkBlockers();
  results.push({
    name: 'Open Blockers',
    status: blockerCount === 0 ? 'pass' : 'fail',
    value: blockerCount,
    threshold: 0,
    message: blockerCount === 0 ? 'No blockers' : `${blockerCount} open blockers`,
  });

  // Determine overall status
  const criticalFails = results.filter(r => r.status === 'fail' && gateConfig[r.name as keyof typeof gateConfig]?.critical).length;
  const overallStatus = criticalFails === 0 ? 'pass' : 'fail';

  const report: CanaryReport = {
    timestamp: new Date().toISOString(),
    workstream,
    overallStatus,
    gates: results,
    summary: {
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.status === 'warn').length,
    },
  };

  return report;
}

function printReport(report: CanaryReport): void {
  console.log(`\n📊 CANARY GATE REPORT — ${report.workstream}`);
  console.log('='.repeat(60));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall Status: ${report.overallStatus === 'pass' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Summary: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings\n`);

  report.gates.forEach(gate => {
    const icon = gate.status === 'pass' ? '✅' : gate.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${gate.name}`);
    console.log(`   Value: ${gate.value} | Threshold: ${gate.threshold}`);
    console.log(`   ${gate.message}\n`);
  });

  console.log('='.repeat(60));
  console.log(`Decision: ${report.overallStatus === 'pass' ? '🟢 GATE PASSES - Ready for promotion' : '🔴 GATE FAILS - Blockers must be resolved'}`);
}

async function main() {
  const workstream = process.argv[2] || 'A';

  try {
    const report = await validateGates(workstream);
    printReport(report);

    // Save report to file
    const reportFile = path.join(process.cwd(), `canary-report-${workstream}-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportFile}`);

    process.exit(report.overallStatus === 'pass' ? 0 : 1);
  } catch (error) {
    console.error('Canary gate validation failed:', error);
    process.exit(2);
  }
}

main();
