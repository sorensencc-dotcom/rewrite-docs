#!/usr/bin/env node
// cic-cli.ts - CIC operator console with repo/extractor/roadmap commands

import { Command } from "commander";
import fetch from "node-fetch";

const program = new Command();

// Configuration from env
const UPDATE_MONITOR_URL = process.env.UPDATE_MONITOR_URL || "http://update-monitor:8000";
const HARVESTER_URL = process.env.HARVESTER_URL || "http://harvester:4000";
const ROADMAP_URL = process.env.ROADMAP_URL || "http://roadmap-service:3000";

program.name("cic").description("CIC operator console").version("1.0.0");

// ============================================================================
// REPO SYNC COMMAND
// ============================================================================

program
  .command("repo sync <repoId>")
  .description("Manually sync external repo and run update-monitor")
  .action(async (repoId) => {
    console.log(`\n[cic] Syncing repo: ${repoId}`);
    console.log(`[cic] Calling: POST ${UPDATE_MONITOR_URL}/sync/${repoId}`);

    try {
      const res = await fetch(`${UPDATE_MONITOR_URL}/sync/${repoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log(`[cic] ✓ Sync complete`);
      console.log(`[cic] Impact tags found: ${data.impact?.length || 0}`);
      console.log(`[cic] Roadmap items created: ${data.roadmap_items_created || 0}`);
      console.log(`[cic] Docker builds triggered: ${data.docker_builds_triggered || 0}`);
    } catch (e) {
      console.error(`[cic] ✗ Sync failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// EXTRACTOR RUN COMMAND
// ============================================================================

program
  .command("extractor run <repoId> [path]")
  .description("Run CodeFlow extractor for a repo")
  .action(async (repoId, path) => {
    const repoPath = path || `/mnt/cic/repos/${repoId}`;
    console.log(`\n[cic] Running extractor: ${repoId}`);
    console.log(`[cic] Repo path: ${repoPath}`);
    console.log(`[cic] Calling: POST ${HARVESTER_URL}/extractor/run`);

    try {
      const res = await fetch(`${HARVESTER_URL}/extractor/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, repoPath })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log(`[cic] ✓ Extraction complete (${data.duration_ms}ms)`);
      console.log(`[cic] Extracted:`);
      console.log(`[cic]   - ${data.extracted.nodes} nodes`);
      console.log(`[cic]   - ${data.extracted.edges} edges`);
      console.log(`[cic]   - ${data.extracted.security} security findings`);
      console.log(`[cic]   - ${data.extracted.patterns} patterns`);
      console.log(`[cic]   - ${data.extracted.impact} impact entries`);
    } catch (e) {
      console.error(`[cic] ✗ Extraction failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// ROADMAP LIST COMMAND
// ============================================================================

program
  .command("roadmap list")
  .option("--source <source>", "Filter by source (external, manual, etc.)", "external")
  .option("--type <type>", "Filter by type (todo, idea)", "")
  .option("--repo <repo>", "Filter by repo (codeflow, etc.)", "")
  .option("--limit <n>", "Max items to return", "50")
  .action(async (opts) => {
    console.log(`\n[cic] Listing roadmap items`);
    console.log(`[cic] Filters: source=${opts.source}${opts.type ? `, type=${opts.type}` : ""}${opts.repo ? `, repo=${opts.repo}` : ""}`);
    console.log(`[cic] Calling: GET ${ROADMAP_URL}/items`);

    try {
      const params = new URLSearchParams({
        source: opts.source,
        limit: opts.limit
      });
      if (opts.type) params.append("type", opts.type);
      if (opts.repo) params.append("repo", opts.repo);

      const res = await fetch(`${ROADMAP_URL}/items?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const items = data.items || [];

      if (items.length === 0) {
        console.log(`[cic] No items found`);
        return;
      }

      console.log(`\n[cic] Found ${items.length} items:\n`);

      for (const item of items) {
        const priority = item.priority === "high" ? "🔴" : item.priority === "medium" ? "🟡" : "🟢";
        const typeIcon = item.type === "todo" ? "✓" : "💡";
        const status = item.status || "pending";

        console.log(`  ${priority} ${typeIcon} [${item.type.toUpperCase()}] ${item.title}`);
        console.log(`     Priority: ${item.priority} | Status: ${status} | Repo: ${item.repo || "N/A"}`);
        if (item.commit_sha) {
          console.log(`     Commit: ${item.commit_sha.substring(0, 8)}`);
        }
        console.log();
      }
    } catch (e) {
      console.error(`[cic] ✗ List failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// QUARANTINE LIST COMMAND
// ============================================================================

program
  .command("quarantine list")
  .description("List quarantined ingestion items")
  .action(() => {
    try {
      const { listQuarantined } = require("./cic-ingestion/src/ingestion/quarantineReview");
      const items = listQuarantined();

      if (items.length === 0) {
        console.log(`\n[cic] No quarantined items`);
        return;
      }

      console.log(`\n[cic] Quarantined items (${items.length}):\n`);
      for (const item of items) {
        const errors = (item.verification?.errors || []).join(", ");
        console.log(`  ID: ${item.id}`);
        console.log(`     Source: ${item.source} | Profile: ${item.profile}`);
        console.log(`     Lane: ${item.lane} | Retries: ${item.retryCount}`);
        console.log(`     Errors: ${errors || "N/A"}`);
        console.log(`     Cost: $${item.cost?.totalCost || 0}`);
        console.log();
      }
    } catch (e) {
      console.error(`[cic] ✗ List failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// QUARANTINE APPROVE COMMAND
// ============================================================================

program
  .command("quarantine approve <id>")
  .option("--lane <lane>", "Target lane for approval", "fast")
  .description("Approve a quarantined ingestion item")
  .action((id, opts) => {
    try {
      const { approveQuarantine } = require("./cic-ingestion/src/ingestion/quarantineReview");
      approveQuarantine(id, opts.lane);
      console.log(`[cic] ✓ Item approved: ${id}`);
      console.log(`[cic]   Target lane: ${opts.lane}`);
      console.log(`[cic]   Flag: forceReingest = true`);
    } catch (e) {
      console.error(`[cic] ✗ Approval failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// QUARANTINE REJECT COMMAND
// ============================================================================

program
  .command("quarantine reject <id>")
  .option("--reason <reason>", "Reason for rejection", "Rejected via CLI")
  .description("Reject a quarantined ingestion item")
  .action((id, opts) => {
    try {
      const { rejectQuarantine } = require("./cic-ingestion/src/ingestion/quarantineReview");
      rejectQuarantine(id, opts.reason);
      console.log(`[cic] ✓ Item rejected: ${id}`);
      console.log(`[cic]   Reason: ${opts.reason}`);
      console.log(`[cic]   Flag: skip = true`);
    } catch (e) {
      console.error(`[cic] ✗ Rejection failed:`, e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  });

// ============================================================================
// STATUS COMMAND
// ============================================================================

program
  .command("status")
  .description("Show status of all CIC services")
  .action(async () => {
    console.log(`\n[cic] Checking service status...\n`);

    const services = [
      { name: "Update Monitor", url: `${UPDATE_MONITOR_URL}/health` },
      { name: "Harvester", url: `${HARVESTER_URL}/health` },
      { name: "Roadmap Service", url: `${ROADMAP_URL}/health` }
    ];

    for (const svc of services) {
      try {
        const res = await fetch(svc.url);
        const status = res.ok ? "✓ OK" : "✗ Error";
        console.log(`  ${status} ${svc.name}`);
      } catch (e) {
        console.log(`  ✗ DOWN ${svc.name}`);
      }
    }

    console.log();
  });

// ============================================================================
// PARSE AND EXECUTE
// ============================================================================

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
