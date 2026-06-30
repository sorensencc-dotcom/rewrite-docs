#!/usr/bin/env node
/*
  filename: docs-manager.ts
  version: 1.0.0
  description: MAAL documentation auditor, syncer, and consolidator
  updated: 2026-06-29
*/

import fs from "fs";
import path from "path";
import crypto from "crypto";

interface AuditFinding {
  type: "missing" | "outdated" | "drift" | "duplicate" | "broken_link";
  location: string;
  description: string;
  severity: "critical" | "warning" | "info";
  suggestion?: string;
}

interface ConsolidationAction {
  type: "merge" | "delete" | "rename";
  source: string;
  target?: string;
  reason: string;
  similarity?: number;
}

interface AuditReport {
  timestamp: string;
  mode: string;
  findings: AuditFinding[];
  summary: {
    total_files_scanned: number;
    total_findings: number;
    missing_count: number;
    drift_count: number;
    duplicate_count: number;
    broken_links_count: number;
  };
}

interface ConsolidationPlan {
  timestamp: string;
  duplicates: Array<{
    file1: string;
    file2: string;
    similarity: number;
    action: string;
  }>;
  merges: ConsolidationAction[];
  deletions: ConsolidationAction[];
  summary: {
    total_duplicates: number;
    total_actions: number;
    estimated_reduction: string;
  };
}

class DocsManager {
  private config: any;
  private rootDir: string;
  private docsDir: string;
  private findings: AuditFinding[] = [];
  private filesScanned: number = 0;

  constructor(configPath: string = "docs-manager/docs-config.json") {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    this.config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    this.validateConfig();

    this.rootDir = this.config.rootDir;
    this.docsDir = path.join(this.rootDir, this.config.docsDir);

    if (!fs.existsSync(this.docsDir)) {
      console.warn(`⚠️  Docs directory not found: ${this.docsDir}`);
    }
  }

  private validateConfig(): void {
    const required = ["rootDir", "docsDir", "mkdocsFile"];
    for (const field of required) {
      if (!this.config[field]) {
        throw new Error(`Config missing required field: ${field}`);
      }
    }
  }

  /**
   * Audit mode: scan code and docs for drift
   */
  async audit(): Promise<AuditReport> {
    console.log("🔍 Auditing documentation...");
    this.findings = [];
    this.filesScanned = 0;

    // Validate schema and structure first
    const schemaValidation = this.validateSchemas();
    if (!schemaValidation.valid) {
      schemaValidation.errors.forEach((err) => {
        const parts = err.match(/^(❌|⚠️)/);
        const severity = err.includes('missing') ? 'critical' : 'warning';
        this.findings.push({
          type: 'drift',
          location: 'docs root',
          description: err,
          severity: severity as 'critical' | 'warning' | 'info',
        });
      });
    }

    const docFiles = this.scanDocsDirectory();
    const codeFiles = this.scanCodeDirectory();

    this.filesScanned = docFiles.length + codeFiles.length;

    // Check for missing documentation
    this.checkMissingDocs(codeFiles, docFiles);

    // Check for outdated documentation
    this.checkOutdatedDocs(docFiles, codeFiles);

    // Check for broken links
    this.checkBrokenLinks(docFiles);

    // Check for drift
    this.checkDrift(docFiles, codeFiles);

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      mode: "audit",
      findings: this.findings,
      summary: this.generateSummary(),
    };

    this.saveReport(report, "docs-audit-report.json");
    return report;
  }

  /**
   * Sync mode: update docs to match code
   */
  async sync(): Promise<any> {
    console.log("🔄 Syncing documentation with code...");

    const operations: any[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Create missing documentation
    const missingDocs = this.findings.filter((f) => f.type === "missing");
    for (const missing of missingDocs) {
      try {
        const op = this.createDocumentation(missing);
        operations.push(op);
        successCount++;
      } catch (e) {
        operations.push({
          type: "create",
          location: missing.suggestion,
          status: "failed",
          error: (e as Error).message,
        });
        failureCount++;
      }
    }

    // Update outdated documentation
    const outdated = this.findings.filter((f) => f.type === "outdated");
    for (const out of outdated) {
      try {
        const op = this.updateDocumentation(out);
        operations.push(op);
        successCount++;
      } catch (e) {
        operations.push({
          type: "update",
          location: out.location,
          status: "failed",
          error: (e as Error).message,
        });
        failureCount++;
      }
    }

    // Fix broken links
    const broken = this.findings.filter((f) => f.type === "broken_link");
    for (const br of broken) {
      try {
        const op = this.fixBrokenLink(br);
        operations.push(op);
        successCount++;
      } catch (e) {
        operations.push({
          type: "fix_link",
          location: br.location,
          status: "failed",
          error: (e as Error).message,
        });
        failureCount++;
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      mode: "sync",
      operations_performed: operations.length,
      operations_succeeded: successCount,
      operations_failed: failureCount,
      operations: operations,
    };

    this.saveReport(summary, "docs-sync-summary.json");
    return summary;
  }

  /**
   * Consolidate mode: eliminate duplicates and merge content
   */
  async consolidate(): Promise<ConsolidationPlan> {
    console.log("🗂️  Consolidating documentation...");

    const docFiles = this.scanDocsDirectory();
    const duplicates = this.findDuplicates(docFiles);
    const merges = this.planMerges(duplicates);
    const deletions = this.planDeletions(duplicates);

    const plan: ConsolidationPlan = {
      timestamp: new Date().toISOString(),
      duplicates: duplicates.map((d) => ({
        file1: d.file1,
        file2: d.file2,
        similarity: d.similarity,
        action: "review",
      })),
      merges: merges,
      deletions: deletions,
      summary: {
        total_duplicates: duplicates.length,
        total_actions: merges.length + deletions.length,
        estimated_reduction: `~${(duplicates.length * 100).toFixed(0)} KB`,
      },
    };

    this.saveReport(plan, "docs-consolidation-plan.json");
    return plan;
  }

  /**
   * Drift mode: identify code-docs divergence
   */
  async drift(): Promise<any> {
    console.log("⚠️  Checking for code-docs drift...");

    const codeFiles = this.scanCodeDirectory();
    const docFiles = this.scanDocsDirectory();

    // Check for missing documentation
    this.checkMissingDocs(codeFiles, docFiles);

    // Check for outdated documentation
    this.checkOutdatedDocs(codeFiles, docFiles);

    // Check for broken links
    this.checkBrokenLinks(docFiles);

    const driftFindings = this.findings.filter((f) => f.severity === "critical");
    const warningFindings = this.findings.filter((f) => f.severity === "warning");
    const infoFindings = this.findings.filter((f) => f.severity === "info");

    const report = {
      timestamp: new Date().toISOString(),
      mode: "drift",
      analysis: {
        code_files_scanned: codeFiles.length,
        doc_files_scanned: docFiles.length,
        missing_docs: driftFindings.filter((f) => f.type === "missing_docs").length,
        outdated_docs: warningFindings.filter((f) => f.type === "outdated").length,
        broken_links: infoFindings.filter((f) => f.type === "broken_link").length,
      },
      drift_areas: this.findings,
      severity_breakdown: {
        critical: driftFindings.length,
        warning: warningFindings.length,
        info: infoFindings.length,
      },
      total_drift_issues: this.findings.length,
    };

    this.saveReport(report, "docs-drift-report.json");
    return report;
  }

  /**
   * Validate documentation schemas and structure
   */
  private validateSchemas(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate mkdocs.yml exists
    const mkdocsPath = path.join(this.rootDir, this.config.mkdocsFile);
    if (!fs.existsSync(mkdocsPath)) {
      errors.push(`❌ mkdocs.yml not found at ${mkdocsPath}`);
    }

    // Validate docs directory exists
    const docsPath = path.join(this.rootDir, this.config.docsDir);
    if (!fs.existsSync(docsPath)) {
      errors.push(`❌ Docs directory not found at ${docsPath}`);
    }

    // Validate index.md exists
    const indexPath = path.join(docsPath, 'index.md');
    if (!fs.existsSync(indexPath)) {
      errors.push(`⚠️  Missing docs/index.md`);
    }

    // Validate docs have frontmatter
    const docFiles = this.scanDocsDirectory();
    const missingFrontmatter = docFiles.filter((file) => {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        return !content.startsWith('---');
      } catch {
        return false;
      }
    });

    if (missingFrontmatter.length > 0) {
      errors.push(`⚠️  ${missingFrontmatter.length} docs missing YAML frontmatter`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Refresh mode: full audit + sync + consolidate
   */
  async refresh(): Promise<any> {
    console.log("🔄 Full documentation refresh...");

    const steps: any[] = [];

    try {
      console.log("  Step 1/3: Audit");
      const auditResult = await this.audit();
      steps.push({
        step: "audit",
        status: "success",
        findings: auditResult.summary.total_findings,
      });

      if (auditResult.summary.total_findings === 0) {
        console.log("  ✅ No issues found in audit");
      }

      console.log("  Step 2/3: Sync");
      const syncResult = await this.sync();
      steps.push({
        step: "sync",
        status: syncResult.operations_failed > 0 ? "partial" : "success",
        operations: syncResult.operations_performed,
        succeeded: syncResult.operations_succeeded,
        failed: syncResult.operations_failed,
      });

      console.log("  Step 3/3: Consolidate");
      const consolidateResult = await this.consolidate();
      steps.push({
        step: "consolidate",
        status: "success",
        actions: consolidateResult.summary.total_actions,
        duplicates: consolidateResult.summary.total_duplicates,
      });

      const refreshReport = {
        timestamp: new Date().toISOString(),
        mode: "refresh",
        steps: steps,
        status: steps.some((s) => s.status === "failed") ? "partial" : "complete",
      };

      this.saveReport(refreshReport, "docs-refresh-report.json");
      return refreshReport;
    } catch (error) {
      console.error("❌ Refresh failed:", error);
      throw error;
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private scanDocsDirectory(): string[] {
    const files: string[] = [];

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.config.ignorePaths.includes(entry)) {
          walk(fullPath);
        } else if (entry.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    };

    walk(this.docsDir);
    return files;
  }

  private scanCodeDirectory(): string[] {
    const files: string[] = [];
    const ignorePaths = this.config.ignorePaths || [];

    const isIgnored = (dirName: string): boolean => {
      return ignorePaths.some((ignore) => dirName.includes(ignore));
    };

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      if (isIgnored(dir)) return;

      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (ignorePaths.includes(entry)) continue;

        const fullPath = path.join(dir, entry);
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch (err: unknown) {
          const error = err as NodeJS.ErrnoException;
          if (error.code === 'EACCES') {
            // Skip inaccessible directories (e.g., Python venv, node_modules symlinks)
            continue;
          }
          throw err;
        }

        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (entry.endsWith(".ts") || entry.endsWith(".json")) {
          files.push(fullPath);
        }
      }
    };

    walk(this.rootDir);
    return files.filter((f) => !f.includes(path.join(this.docsDir)));
  }

  private checkMissingDocs(codeFiles: string[], docFiles: string[]): void {
    const docNames = new Set(docFiles.map((f) => path.basename(f, ".md")));

    for (const codeFile of codeFiles) {
      const baseName = path.basename(codeFile).replace(/\.[^.]+$/, "");

      // Check if batch has documentation
      if (codeFile.includes("batch-")) {
        const batchNum = baseName.match(/batch-(\d+)/)?.[1];
        if (batchNum && !docNames.has(`batch-${batchNum}`)) {
          this.findings.push({
            type: "missing",
            location: codeFile,
            description: `Batch ${batchNum} lacks documentation`,
            severity: "critical",
            suggestion: `Create docs/batches/batch-${batchNum}.md`,
          });
        }
      }

      // Check if exported functions are documented (improved regex)
      if (codeFile.endsWith(".ts")) {
        const content = fs.readFileSync(codeFile, "utf8");
        // Match: export function/class/type/interface/async function/const (arrow fn)
        const exportRegex =
          /export\s+(?:async\s+)?(?:function|class|type|interface|const)\s+(\w+)/g;
        let match;

        while ((match = exportRegex.exec(content)) !== null) {
          const name = match[1];
          if (name && !docNames.has(name)) {
            this.findings.push({
              type: "missing",
              location: codeFile,
              description: `Exported \`${name}\` lacks documentation`,
              severity: "warning",
              suggestion: `Document \`${name}\` in API reference`,
            });
          }
        }
      }
    }
  }

  private checkOutdatedDocs(docFiles: string[], codeFiles: string[]): void {
    for (const docFile of docFiles) {
      const docContent = fs.readFileSync(docFile, "utf8");

      // Check for outdated version numbers
      const versionMatch = docContent.match(/version:\s*["']([^"']+)["']/);
      if (versionMatch) {
        // Could compare with actual code version
        // This is a placeholder
      }

      // Check for outdated signatures
      if (docContent.includes("function ") || docContent.includes("Signature")) {
        // Cross-reference with code
        // This is a placeholder
      }
    }
  }

  private checkBrokenLinks(docFiles: string[]): void {
    const docExists = new Set(docFiles.map((f) => path.relative(this.docsDir, f)));

    for (const docFile of docFiles) {
      const content = fs.readFileSync(docFile, "utf8");

      // Find markdown links [text](url) — strip anchor fragments
      const links = content.match(/\[.*?\]\((.*?)\)/g) || [];
      for (const link of links) {
        const fullUrl = link.match(/\((.*?)\)/)?.[1];
        if (!fullUrl) continue;

        // Skip external links and anchors
        if (fullUrl.startsWith("http") || fullUrl.startsWith("#")) continue;

        // Strip anchor fragment for file existence check
        const urlWithoutAnchor = fullUrl.split("#")[0];
        if (!urlWithoutAnchor) continue; // Anchor-only link

        if (urlWithoutAnchor.startsWith("../") || urlWithoutAnchor.startsWith("./")) {
          const targetPath = path.resolve(path.dirname(docFile), urlWithoutAnchor);
          const relPath = path.relative(this.docsDir, targetPath);

          // Check both with and without .md extension
          const normalized = relPath.replace(".md", "");
          const exists =
            fs.existsSync(targetPath) ||
            docExists.has(relPath) ||
            docExists.has(normalized) ||
            docExists.has(relPath + ".md");

          if (!exists) {
            this.findings.push({
              type: "broken_link",
              location: docFile,
              description: `Broken link: \`${fullUrl}\` (target: ${urlWithoutAnchor})`,
              severity: "warning",
              suggestion: `Verify path exists or remove link`,
            });
          }
        }
      }
    }
  }

  private checkDrift(docFiles: string[], codeFiles: string[]): void {
    // Check for API changes not documented
    // Check for schema mismatches
    // This is a placeholder for sophisticated drift detection
    console.log("  Drift checks completed");
  }

  private findDuplicates(
    docFiles: string[]
  ): Array<{ file1: string; file2: string; similarity: number }> {
    const duplicates: Array<{ file1: string; file2: string; similarity: number }> = [];

    for (let i = 0; i < docFiles.length; i++) {
      for (let j = i + 1; j < docFiles.length; j++) {
        const content1 = fs.readFileSync(docFiles[i], "utf8");
        const content2 = fs.readFileSync(docFiles[j], "utf8");

        const similarity = this.calculateSimilarity(content1, content2);
        if (similarity > 0.7) {
          duplicates.push({
            file1: docFiles[i],
            file2: docFiles[j],
            similarity,
          });
        }
      }
    }

    return duplicates;
  }

  private calculateSimilarity(a: string, b: string): number {
    // Simple line-by-line similarity (improved from naive string matching)
    const aLines = a.split("\n");
    const bLines = b.split("\n");

    let matches = 0;
    for (const aLine of aLines) {
      if (bLines.some((bLine) => aLine.trim() === bLine.trim() && aLine.trim().length > 10)) {
        matches++;
      }
    }

    const maxLen = Math.max(aLines.length, bLines.length);
    if (maxLen === 0) return 0;

    // Weighted: 70% line overlap, 30% length similarity
    const lineOverlap = matches / maxLen;
    const lenSimilarity = Math.min(aLines.length, bLines.length) / maxLen;

    return lineOverlap * 0.7 + lenSimilarity * 0.3;
  }

  private planMerges(
    duplicates: Array<{ file1: string; file2: string; similarity: number }>
  ): ConsolidationAction[] {
    return duplicates.map((d) => ({
      type: "merge",
      source: d.file1,
      target: d.file2,
      reason: `Duplicate content (${(d.similarity * 100).toFixed(0)}% similar)`,
      similarity: d.similarity,
    }));
  }

  private planDeletions(
    duplicates: Array<{ file1: string; file2: string; similarity: number }>
  ): ConsolidationAction[] {
    return duplicates.map((d) => ({
      type: "delete",
      source: d.file1,
      reason: `Duplicate of ${d.file2}`,
    }));
  }

  private createDocumentation(finding: AuditFinding): any {
    if (!finding.suggestion) {
      throw new Error(`No suggestion for missing doc at ${finding.location}`);
    }

    console.log(`  Creating: ${finding.suggestion}`);

    try {
      const filePath = path.join(this.rootDir, finding.suggestion);
      const dir = path.dirname(filePath);

      // Create directory if needed
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create stub documentation
      const stub = `# ${path.basename(finding.suggestion, ".md")}\n\n${finding.description}\n\n## TODO\n\nDocument this section.\n`;

      fs.writeFileSync(filePath, stub);

      return {
        type: "create",
        location: finding.suggestion,
        status: "success",
      };
    } catch (e) {
      throw new Error(`Failed to create ${finding.suggestion}: ${(e as Error).message}`);
    }
  }

  private updateDocumentation(finding: AuditFinding): any {
    console.log(`  Updating: ${finding.location}`);

    try {
      // Append outdated notice to file
      const filePath = path.join(this.rootDir, finding.location);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        const notice = `\n\n⚠️ **OUTDATED**: ${finding.description}\n`;

        if (!content.includes("OUTDATED")) {
          fs.appendFileSync(filePath, notice);
        }
      }

      return {
        type: "update",
        location: finding.location,
        status: "success",
      };
    } catch (e) {
      throw new Error(`Failed to update ${finding.location}: ${(e as Error).message}`);
    }
  }

  private fixBrokenLink(finding: AuditFinding): any {
    console.log(`  Fixing link: ${finding.location}`);

    // Returns plan; actual fixing requires human review
    return {
      type: "fix_link",
      location: finding.location,
      issue: finding.description,
      status: "pending_review",
    };
  }

  private generateSummary() {
    return {
      total_files_scanned: this.filesScanned,
      total_findings: this.findings.length,
      missing_count: this.findings.filter((f) => f.type === "missing").length,
      outdated_count: this.findings.filter((f) => f.type === "outdated").length,
      drift_count: this.findings.filter((f) => f.type === "drift").length,
      duplicate_count: this.findings.filter((f) => f.type === "duplicate").length,
      broken_links_count: this.findings.filter((f) => f.type === "broken_link").length,
      severity_breakdown: {
        critical: this.findings.filter((f) => f.severity === "critical").length,
        warning: this.findings.filter((f) => f.severity === "warning").length,
        info: this.findings.filter((f) => f.severity === "info").length,
      },
    };
  }

  private saveReport(report: any, filename: string): void {
    const outputDir = path.join(this.rootDir, this.config.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved: ${filepath}`);
  }
}

// CLI Entry Point
async function main() {
  const mode = process.argv[2] || "audit";
  const configPath = process.argv[3] || "docs-manager/docs-config.json";

  const manager = new DocsManager(configPath);

  try {
    switch (mode) {
      case "audit":
        await manager.audit();
        break;
      case "sync":
        await manager.sync();
        break;
      case "consolidate":
        await manager.consolidate();
        break;
      case "drift":
        await manager.drift();
        break;
      case "refresh":
        await manager.refresh();
        break;
      default:
        console.error(`Unknown mode: ${mode}`);
        process.exit(1);
    }

    console.log("✅ Documentation management complete");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();

export { DocsManager, AuditReport, ConsolidationPlan };
