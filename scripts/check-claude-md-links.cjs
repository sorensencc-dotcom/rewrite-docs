#!/usr/bin/env node
// Verifies every relative markdown link in each CLAUDE.md resolves to a real file.
// Catches CLAUDE.md drift: doc claims pointing at renamed/removed/never-created files.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;

function findClaudeMdFiles() {
  const out = execSync(
    'git ls-files -- "CLAUDE.md" "**/CLAUDE.md"',
    { cwd: ROOT, encoding: "utf8" }
  );
  return out.split("\n").filter(Boolean);
}

function isExternal(link) {
  return /^([a-z]+:)?\/\//i.test(link) || link.startsWith("mailto:");
}

function stripCode(text) {
  // Blank out fenced code blocks and inline code spans (keep line count/offsets intact)
  // so illustrative markdown-link examples inside them aren't treated as real links.
  return text
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/`[^`\n]*`/g, (m) => m.replace(/[^\n]/g, " "));
}

function checkFile(relFile) {
  const abs = path.join(ROOT, relFile);
  const raw = fs.readFileSync(abs, "utf8");
  const text = stripCode(raw);
  const dir = path.dirname(abs);
  const failures = [];
  let m;
  while ((m = LINK_RE.exec(text)) !== null) {
    let link = m[1].split(" ")[0].trim();
    if (!link || isExternal(link)) continue;
    link = link.split("#")[0];
    if (!link) continue;
    const target = path.resolve(dir, link);
    if (!fs.existsSync(target)) {
      failures.push({ link, line: text.slice(0, m.index).split("\n").length });
    }
  }
  return failures;
}

function main() {
  const files = findClaudeMdFiles();
  let brokenTotal = 0;
  for (const relFile of files) {
    const failures = checkFile(relFile);
    if (failures.length) {
      brokenTotal += failures.length;
      console.log(`\n${relFile}:`);
      for (const f of failures) {
        console.log(`  line ${f.line}: broken link -> ${f.link}`);
      }
    }
  }
  if (brokenTotal > 0) {
    console.error(`\nCLAUDE.md drift check FAILED: ${brokenTotal} broken link(s) across ${files.length} file(s).`);
    process.exit(1);
  }
  console.log(`CLAUDE.md drift check OK: ${files.length} file(s), 0 broken links.`);
}

main();
