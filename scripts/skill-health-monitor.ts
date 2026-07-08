#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, "../toolforge/skills");

interface SkillMeta {
  id: string;
  version: string;
  category?: string;
  entrypoint?: string;
}

interface HealthScore {
  total: number;
  operational: number;
  warnings: number;
  errors: number;
  percentage: number;
}

interface SkillStatus {
  skill: string;
  status: "✅" | "⚠️" | "❌";
  issues: string[];
}

const REQUIRED_FILES = ["skill.json", "SKILL.md"];
const OPTIONAL_FILES = ["INTEGRATION_DIAGRAM.md", "src/index.ts", "tests/"];
const VALID_CATEGORIES = [
  "session-management",
  "observability",
  "governance",
  "pipeline",
  "data-management",
  "monitoring",
  "utilities",
];

async function validateSkill(skillPath: string): Promise<SkillStatus> {
  const skillName = path.basename(skillPath);
  const issues: string[] = [];

  // Check required files
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(skillPath, file);
    if (!fs.existsSync(filePath)) {
      issues.push(`Missing: ${file}`);
    }
  }

  // Check skill.json validity
  const skillJsonPath = path.join(skillPath, "skill.json");
  if (fs.existsSync(skillJsonPath)) {
    try {
      const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, "utf-8"));
      const meta = skillJson as SkillMeta;

      // Validate entrypoint
      if (!meta.entrypoint) {
        issues.push("Missing entrypoint in skill.json");
      } else {
        const entrypointPath = path.join(skillPath, meta.entrypoint);
        if (!fs.existsSync(entrypointPath)) {
          issues.push(`Entrypoint not found: ${meta.entrypoint}`);
        }
      }

      // Validate category
      if (!meta.category || !VALID_CATEGORIES.includes(meta.category)) {
        issues.push(`Invalid category: ${meta.category || "missing"}`);
      }
    } catch (e) {
      issues.push("Invalid skill.json JSON");
    }
  }

  // Determine status
  let status: "✅" | "⚠️" | "❌" = "✅";
  if (issues.length > 0) {
    status = issues.some((i) =>
      i.startsWith("Missing") || i.startsWith("Entrypoint")
    )
      ? "❌"
      : "⚠️";
  }

  return { skill: skillName, status, issues };
}

async function runHealthMonitor() {
  console.log("\n🏥 Skill Health Monitor\n");
  console.log(`Scanning: ${skillsDir}\n`);

  if (!fs.existsSync(skillsDir)) {
    console.log("⚠️  No toolforge/skills directory found. Nothing to scan.\n");
    process.exit(0);
  }

  const skillDirs = fs
    .readdirSync(skillsDir)
    .filter((f) => fs.statSync(path.join(skillsDir, f)).isDirectory());

  if (skillDirs.length === 0) {
    console.log("⚠️  No skills found in toolforge/skills/\n");
    process.exit(0);
  }

  const results: SkillStatus[] = [];
  for (const skill of skillDirs) {
    const result = await validateSkill(path.join(skillsDir, skill));
    results.push(result);
  }

  // Print results
  console.log("Skills Status:\n");
  results.forEach((r) => {
    console.log(`  ${r.status} ${r.skill}`);
    if (r.issues.length > 0) {
      r.issues.forEach((i) => console.log(`     - ${i}`));
    }
  });

  // Calculate health score
  const health: HealthScore = {
    total: results.length,
    operational: results.filter((r) => r.status === "✅").length,
    warnings: results.filter((r) => r.status === "⚠️").length,
    errors: results.filter((r) => r.status === "❌").length,
    percentage: 0,
  };

  health.percentage = Math.round((health.operational / health.total) * 100);

  console.log(`\n📊 Health Score: ${health.percentage}/100`);
  console.log(
    `   ${health.operational}/${health.total} operational | ${health.warnings} warnings | ${health.errors} errors\n`
  );

  // Exit with error code if any errors
  if (health.errors > 0) {
    console.log("❌ Health check failed. Fix errors above.\n");
    process.exit(1);
  }

  if (health.warnings > 0) {
    console.log("⚠️  Health check passed but with warnings.\n");
  } else {
    console.log("✅ All skills healthy!\n");
  }
}

runHealthMonitor().catch((e) => {
  console.error("Health monitor error:", e);
  process.exit(1);
});
