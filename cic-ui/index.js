#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = process.cwd();
const configPath = path.join(root, "cic-ui/config.json");

if (!fs.existsSync(configPath)) {
  process.stderr.write(`✗ Config not found: ${configPath}\n`);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (e) {
  process.stderr.write(`✗ Invalid config JSON: ${e.message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
let name = args[0];
const dryRun = args.includes("--dry-run");

if (name === "add") {
  name = args[1];
}

if (name === "list") {
  listComponents();
  process.exit(0);
}

if (!name || name === "help" || name === "--help" || name === "-h") {
  showHelp();
  process.exit(name ? 0 : 1);
}

// Validate component name format
if (!/^[a-z]+(-[a-z]+)*$/.test(name)) {
  process.stderr.write(
    `✗ Invalid component name: "${name}"\n  Use lowercase with hyphens: button, form-field, date-picker\n`
  );
  process.exit(1);
}

const Name = name
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join("");

// Validate config directories
const requiredDirs = [
  "componentDir",
  "styleDir",
  "storyDir",
  "testDir",
  "visualDir",
  "tokenMapDir",
];
for (const dir of requiredDirs) {
  if (!config[dir]) {
    process.stderr.write(`✗ Missing config key: ${dir}\n`);
    process.exit(1);
  }
}

const templateDir = path.join(__dirname, "templates");

function generate(template, dest) {
  const templatePath = path.join(templateDir, template);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const content = fs
    .readFileSync(templatePath, "utf8")
    .replace(/{{name}}/g, name)
    .replace(/{{Name}}/g, Name);

  if (dryRun) {
    process.stdout.write(`  [DRY-RUN] Would create: ${dest}\n`);
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) {
    throw new Error(`Already exists: ${dest}`);
  }
  fs.writeFileSync(dest, content);
}

function appendToIndex() {
  const indexPath = path.join(root, config.componentDir, "index.ts");
  if (!fs.existsSync(indexPath)) {
    return;
  }

  const indexContent = fs.readFileSync(indexPath, "utf8");
  if (indexContent.includes(`export * from "./${Name}"`)) {
    return;
  }

  if (dryRun) {
    process.stdout.write(
      `  [DRY-RUN] Would append to: ${indexPath}\n`
    );
    return;
  }

  fs.appendFileSync(indexPath, `export * from "./${Name}";\n`);
}

try {
  process.stdout.write(`\n✓ Generating component: ${Name} (${name})\n`);

  const files = [
    ["component.tsx", path.join(root, config.componentDir, `${Name}.tsx`)],
    ["styles.css", path.join(root, config.styleDir, `${name}.css`)],
    ["story.tsx", path.join(root, config.storyDir, `${Name}.stories.tsx`)],
    ["test.tsx", path.join(root, config.testDir, `${Name}.test.tsx`)],
    ["visual.spec.ts", path.join(root, config.visualDir, `${Name}.spec.ts`)],
    ["token-map.md", path.join(root, config.tokenMapDir, `${Name}.md`)],
  ];

  for (const [template, dest] of files) {
    generate(template, dest);
    const relPath = path.relative(root, dest);
    if (!dryRun) {
      process.stdout.write(`  ✓ ${relPath}\n`);
    }
  }

  appendToIndex();

  if (dryRun) {
    process.stdout.write(`\n✓ Dry-run complete (no files written)\n`);
  } else {
    const indexPath = path.join(root, config.componentDir, "index.ts");
    const relIndex = path.relative(root, indexPath);
    if (fs.existsSync(indexPath)) {
      process.stdout.write(`  ✓ ${relIndex} (appended export)\n`);
    }
    process.stdout.write(`\n✓ Component created successfully\n\n`);
  }
} catch (err) {
  process.stderr.write(`\n✗ Error: ${err.message}\n`);
  process.exit(1);
}

function showHelp() {
  process.stdout.write(`
CIC Component Generator v1.0

Usage:
  npm run cic-ui -- <component>           Generate a new component
  npm run cic-ui add <component>          Same as above
  npm run cic-ui list                     List existing components
  npm run cic-ui -- <component> --dry-run Preview generation
  npm run cic-ui help                     Show this help

Examples:
  npm run cic-ui -- button
  npm run cic-ui -- form-field
  npm run cic-ui -- date-picker --dry-run

Component names:
  - Use lowercase with optional hyphens
  - Single word: button, table, panel
  - Multiple words: form-field, date-picker, color-input

Generated files:
  - src/components/cic/<ComponentName>.tsx
  - src/components/cic/<componentname>.css
  - src/stories/cic/<ComponentName>.stories.tsx
  - src/tests/cic/<ComponentName>.test.tsx
  - src/visual/cic/<ComponentName>.spec.ts
  - docs/tokens/usage/<ComponentName>.md
`);
}

function listComponents() {
  const componentDir = path.join(root, config.componentDir);
  if (!fs.existsSync(componentDir)) {
    process.stdout.write("No components found\n");
    return;
  }

  const files = fs
    .readdirSync(componentDir)
    .filter((f) => f.endsWith(".tsx") && f !== "index.ts");

  if (files.length === 0) {
    process.stdout.write("No components found\n");
    return;
  }

  process.stdout.write(`\nExisting components (${files.length}):\n\n`);
  files.forEach((f) => {
    process.stdout.write(`  • ${f.replace(".tsx", "")}\n`);
  });
  process.stdout.write("\n");
}
