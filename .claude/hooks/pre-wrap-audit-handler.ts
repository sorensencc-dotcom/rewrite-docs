/**
 * Pre-Wrap-Audit Hook Handler for Claude Code
 *
 * This handler integrates the pre-wrap-audit skill with Claude Code's lifecycle hooks.
 * Place this in .claude/hooks/ and configure in settings.json to auto-trigger on /finish or session end.
 *
 * Usage in Claude Code settings.json:
 * {
 *   "hooks": {
 *     "before-session-end": "node .claude/hooks/pre-wrap-audit-handler.ts"
 *   }
 * }
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface HookContext {
  sessionId: string;
  projectContext?: string;
  timestamp: string;
  workingDir: string;
}

interface AuditResult {
  verdict: 'RED' | 'YELLOW' | 'GREEN';
  stored: boolean;
  reportPath?: string;
}

/**
 * Run pre-wrap-audit and return verdict
 */
export async function runPreWrapAudit(context: HookContext): Promise<AuditResult> {
  const workDir = context.workingDir || process.cwd();

  console.log('\n🔍 [Hook] Pre-Wrap-Audit Starting');
  console.log(`    Session: ${context.sessionId}`);
  console.log(`    Time: ${context.timestamp}\n`);

  try {
    // Run audit CLI
    const cmd = `npm run audit:pre-wrap -- --session=${context.sessionId} --format=json`;
    const output = execSync(cmd, {
      cwd: workDir,
      encoding: 'utf-8',
    });

    // Parse verdict from output
    let verdict: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
    let reportPath: string | undefined;

    if (output.includes('"verdict":"RED"')) {
      verdict = 'RED';
    } else if (output.includes('"verdict":"YELLOW"')) {
      verdict = 'YELLOW';
    }

    // Find report file
    const sessionDir = path.join(workDir, '.claude', 'sessions', context.sessionId);
    reportPath = path.join(sessionDir, 'audit-report.json');

    console.log(`[Hook] Verdict: ${verdict}`);
    console.log(`[Hook] Report: ${reportPath}\n`);

    // Handle verdict
    if (verdict === 'RED') {
      console.error('[Hook] ❌ RED FLAG: Session BLOCKED. Resolve blockers before terminating.');
      return { verdict: 'RED', stored: true, reportPath };
    }

    if (verdict === 'YELLOW') {
      console.warn('[Hook] ⚠️  YELLOW FLAG: Risks detected. Escalating for review.');
      return { verdict: 'YELLOW', stored: true, reportPath };
    }

    console.log('[Hook] ✅ GREEN FLAG: Audit passed. Proceeding with session end.\n');
    return { verdict: 'GREEN', stored: true, reportPath };
  } catch (err) {
    console.error('[Hook] ❌ Audit execution failed:', err);
    return { verdict: 'RED', stored: false };
  }
}

/**
 * Handle session termination with audit gate
 */
export async function handleSessionTermination(context: HookContext): Promise<boolean> {
  const result = await runPreWrapAudit(context);

  // Block on RED
  if (result.verdict === 'RED') {
    console.error('[Hook] Termination blocked by RED flag.');
    return false;
  }

  // Escalate on YELLOW (but allow with warning)
  if (result.verdict === 'YELLOW') {
    console.warn('[Hook] YELLOW flag present—escalating to team. Proceeding with caution.');
    // In production, would send Slack alert or create incident
  }

  // Proceed on GREEN
  console.log('[Hook] Proceeding with session termination.');
  return true;
}

/**
 * Handle /finish command
 * Called by Claude Code when user types /finish
 */
export async function handleFinishCommand(context: HookContext): Promise<void> {
  const allowed = await handleSessionTermination(context);

  if (!allowed) {
    throw new Error('Session termination blocked by pre-wrap-audit');
  }

  console.log('[Hook] Session ready to terminate. Running final steps...');
  // Final cleanup, logging, etc.
}

/**
 * CLI entry point for direct invocation
 */
if (require.main === module) {
  const context: HookContext = {
    sessionId: process.env.CLAUDE_SESSION_ID || `session-${Date.now()}`,
    projectContext: process.env.CLAUDE_PROJECT_CONTEXT || 'CIC Agent Runtime',
    timestamp: new Date().toISOString(),
    workingDir: process.cwd(),
  };

  handleFinishCommand(context)
    .then(() => {
      console.log('[Hook] ✅ All checks passed. Safe to terminate.\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Hook] ❌ Hook failed:', err.message);
      process.exit(1);
    });
}

export type { HookContext, AuditResult };
