// cic-cli-governance.ts - Extensions to CIC CLI for policy + approval + drift
// Add to cic-cli.ts

import { Command } from "commander";
import fetch from "node-fetch";

const ROADMAP_URL = process.env.ROADMAP_URL || "http://roadmap-service:3000";

// ============================================================================
// ROADMAP APPROVE COMMAND
// ============================================================================

program
  .command("roadmap approve <itemId>")
  .description("Approve a candidate roadmap item")
  .action(async (itemId) => {
    console.log(`\n[cic] Approving roadmap item: ${itemId}`);

    try {
      const res = await fetch(`${ROADMAP_URL}/items/${itemId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: process.env.USER || "cic-cli",
          reason: "Approved via CLI"
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log(`[cic] ✓ Item approved`);
      console.log(`[cic]   State: ${data.state}`);
      console.log(`[cic]   Policy: ${data.policy} ${data.blocking ? "(blocking)" : ""}`);
      console.log(`[cic]   Deadline: ${data.deadline || "N/A"}`);
    } catch (e) {
      console.error(`[cic] ✗ Approval failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// ROADMAP REJECT COMMAND
// ============================================================================

program
  .command("roadmap reject <itemId>")
  .description("Reject a candidate roadmap item")
  .option("-r, --reason <reason>", "Reason for rejection", "Rejected via CLI")
  .action(async (itemId, opts) => {
    console.log(`\n[cic] Rejecting roadmap item: ${itemId}`);

    try {
      const res = await fetch(`${ROADMAP_URL}/items/${itemId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: process.env.USER || "cic-cli",
          reason: opts.reason
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log(`[cic] ✓ Item rejected`);
      console.log(`[cic]   State: ${data.state}`);
    } catch (e) {
      console.error(`[cic] ✗ Rejection failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// ROADMAP ACTIVATE COMMAND
// ============================================================================

program
  .command("roadmap activate <itemId>")
  .description("Activate an approved item (apply changes to CIC)")
  .action(async (itemId) => {
    console.log(`\n[cic] Activating roadmap item: ${itemId}`);

    try {
      const res = await fetch(`${ROADMAP_URL}/items/${itemId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: process.env.USER || "cic-cli",
          reason: "Activated via CLI"
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log(`[cic] ✓ Item activated`);
      console.log(`[cic]   State: ${data.state}`);
      console.log(`[cic]   Applied at: ${data.activated_at}`);
    } catch (e) {
      console.error(`[cic] ✗ Activation failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// ROADMAP POLICY COMMAND
// ============================================================================

program
  .command("roadmap policy")
  .description("Show active policy rules")
  .action(async () => {
    console.log(`\n[cic] Fetching policy manifest...\n`);

    try {
      const res = await fetch(`${ROADMAP_URL}/policy`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const policy = await res.json();

      for (const [repoId, rules] of Object.entries(policy.repos)) {
        console.log(`${repoId}:`);
        (rules as any[]).forEach((rule) => {
          const icon = rule.adoption === "must-adopt" ? "🔴" : "🟢";
          const block = rule.blocking ? " (blocking)" : "";
          console.log(
            `  ${icon} ${rule.match} → ${rule.adoption}${block} — ${rule.reason}`
          );
        });
        console.log();
      }

      console.log(`Release gates:`);
      policy.release_gates.forEach((gate: any) => {
        console.log(`  • ${gate.name}: ${gate.description}`);
      });
    } catch (e) {
      console.error(`[cic] ✗ Failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// ROADMAP DRIFT COMMAND
// ============================================================================

program
  .command("roadmap drift <repoId>")
  .description("Show drift analysis for a repo")
  .action(async (repoId) => {
    console.log(`\n[cic] Analyzing drift for: ${repoId}\n`);

    try {
      const res = await fetch(`${ROADMAP_URL}/drift/${repoId}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const drift = await res.json();

      console.log(`Status: ${drift.isDrifting ? "🔴 DRIFTING" : "✓ IN SYNC"}`);
      console.log(`Severity: ${drift.severity.toUpperCase()}`);
      console.log();

      console.log(`Coverage:`);
      console.log(`  Edges:    ${drift.metrics.edges_coverage}% (${drift.metrics.edges_total - drift.metrics.edges_missing}/${drift.metrics.edges_total})`);
      console.log(`  Security: ${drift.metrics.security_coverage}% (${drift.metrics.security_total - drift.metrics.security_missing}/${drift.metrics.security_total})`);
      console.log(`  Patterns: ${drift.metrics.patterns_coverage}% (${drift.metrics.patterns_total - drift.metrics.patterns_missing}/${drift.metrics.patterns_total})`);
      console.log();

      if (drift.missingSecurity.length > 0) {
        console.log(`⚠️  Missing Security Issues (${drift.missingSecurity.length}):`);
        drift.missingSecurity.slice(0, 5).forEach((s: any) => {
          console.log(`    ${s.file}:${s.line} — ${s.type} [${s.severity}]`);
        });
        if (drift.missingSecurity.length > 5) {
          console.log(`    ... and ${drift.missingSecurity.length - 5} more`);
        }
        console.log();
      }

      if (drift.missingEdges.length > 0) {
        console.log(`Missing Dependencies (${drift.missingEdges.length}):`);
        drift.missingEdges.slice(0, 5).forEach((e: any) => {
          console.log(`    ${e.from} → ${e.to}`);
        });
        if (drift.missingEdges.length > 5) {
          console.log(`    ... and ${drift.missingEdges.length - 5} more`);
        }
      }
    } catch (e) {
      console.error(`[cic] ✗ Failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// RELEASE GATES COMMAND
// ============================================================================

program
  .command("release gates")
  .description("Check if release is blocked")
  .action(async () => {
    console.log(`\n[cic] Checking release gates...\n`);

    try {
      const res = await fetch(`${ROADMAP_URL}/release-gates`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const gates = await res.json();

      if (gates.blocked) {
        console.log(`🔴 RELEASE BLOCKED`);
        console.log(`\nReason: ${gates.reason}`);
        console.log(`\nBlocking items:`);
        gates.blocking_items.forEach((item: any) => {
          console.log(`  • [${item.type}] ${item.title} (${item.repo}, ${item.state})`);
        });
      } else {
        console.log(`✓ RELEASE APPROVED`);
        console.log(`\nAll required items are active.`);
      }

      console.log();
    } catch (e) {
      console.error(`[cic] ✗ Failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });
