#!/usr/bin/env tsx
/**
 * Pre-Wrap-Audit CLI Wrapper
 * Invokes the pre-wrap-audit skill and returns verdict
 * Usage: npm run audit:pre-wrap -- [--session=ID] [--context="PROJECT"]
 */

import { runAudit, formatAuditReport, AuditReport } from '../toolforge/skills/pre-wrap-audit/src/index';
import fs from 'fs';
import path from 'path';

interface CLIOptions {
  sessionId?: string;
  context?: string;
  format?: 'json' | 'markdown' | 'summary';
  store?: boolean;
  block?: boolean;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const opts: CLIOptions = {
    format: 'markdown',
    store: true,
    block: true,
  };

  for (const arg of args) {
    if (arg.startsWith('--session=')) {
      opts.sessionId = arg.split('=')[1];
    } else if (arg.startsWith('--context=')) {
      opts.context = arg.split('=')[1];
    } else if (arg.startsWith('--format=')) {
      opts.format = (arg.split('=')[1] as any) || 'markdown';
    } else if (arg === '--no-store') {
      opts.store = false;
    } else if (arg === '--no-block') {
      opts.block = false;
    }
  }

  return opts;
}

/**
 * Store audit report to .claude/sessions/[sessionId]/audit-report.json
 */
function storeReport(report: AuditReport, sessionId: string): string {
  const sessionDir = path.join(process.cwd(), '.claude', 'sessions', sessionId);
  const reportPath = path.join(sessionDir, 'audit-report.json');

  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return reportPath;
}

/**
 * Main entry point
 */
async function main() {
  const opts = parseArgs();

  // Generate session ID if not provided
  const sessionId = opts.sessionId || `session-${Date.now()}`;

  console.log('\n🔍 Pre-Wrap-Audit CLI Wrapper');
  console.log(`Session: ${sessionId}\n`);

  try {
    // Run audit
    const report = await runAudit({
      sessionId,
      projectContext: opts.context,
      interactive: true,
    });

    // Store if requested
    if (opts.store) {
      const storagePath = storeReport(report, sessionId);
      console.log(`\n📊 Report stored: ${storagePath}`);
      report.stored = true;
    }

    // Format output
    const formatted = formatAuditReport(report, opts.format);
    console.log('\n' + formatted);

    // Handle verdict
    const verdictCode = {
      RED: 1,
      YELLOW: 2,
      GREEN: 0,
    }[report.verdict];

    if (opts.block && report.verdict === 'RED') {
      console.error('\n❌ RED FLAG: Cannot proceed. Resolve blockers and rerun.\n');
      process.exit(1);
    }

    if (opts.block && report.verdict === 'YELLOW') {
      console.warn(
        '\n⚠️  YELLOW FLAG: Risks present. Explicitly accept before proceeding.\n' +
          'Type: npm run audit:pre-wrap -- --accept-risk\n'
      );
      process.exit(2);
    }

    if (report.verdict === 'GREEN') {
      console.log('\n✅ GREEN FLAG: Audit passed. Safe to proceed.\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ Audit failed:', err);
    process.exit(1);
  }
}

main();
