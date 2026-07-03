const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repos = [
  "C:\\dev\\cic-os",
  "C:\\dev\\claude-skills",
  "C:\\dev\\cic-ingestion",
  "C:\\dev\\rewrite-mcp",
  "C:\\dev\\charlie-deep-research"
];

const scriptDir = "C:\\Users\\soren\\castironforge\\scripts";

for (const repo of repos) {
  if (!fs.existsSync(repo)) {
    console.log(`Skipping ${repo} - does not exist.`);
    continue;
  }
  
  console.log(`\n======================================================`);
  console.log(`🚀 Deploying to ${path.basename(repo)}...`);
  const pkgPath = path.join(repo, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(`❌ Error: package.json not found in ${repo}`);
    continue;
  }

  // 1. Install husky
  const pkgStr = fs.readFileSync(pkgPath, 'utf8');
  if (!pkgStr.includes('"husky"')) {
    console.log("📦 Installing husky...");
    execSync('npm install husky --save-dev', { cwd: repo, stdio: 'inherit' });
  }

  // 2. Initialize husky
  const huskyDir = path.join(repo, '.husky');
  if (!fs.existsSync(huskyDir)) {
    console.log("🪝 Initializing husky...");
    execSync('npx husky install', { cwd: repo, stdio: 'inherit' });
  }

  // 3. Copy scripts
  console.log("📋 Setting up pre-commit agent scripts...");
  const targetScriptsDir = path.join(repo, 'scripts');
  if (!fs.existsSync(targetScriptsDir)) fs.mkdirSync(targetScriptsDir, { recursive: true });
  
  fs.copyFileSync(path.join(scriptDir, 'shared-utils.js'), path.join(targetScriptsDir, 'shared-utils.js'));
  fs.copyFileSync(path.join(scriptDir, 'code-review.js'), path.join(targetScriptsDir, 'code-review.js'));
  fs.copyFileSync(path.join(scriptDir, 'generate-docs.js'), path.join(targetScriptsDir, 'generate-docs.js'));

  // 4. Create pre-commit hook
  console.log("🪝 Installing pre-commit hook...");
  const hookPath = path.join(huskyDir, 'pre-commit');
  const hookContent = `#!/bin/sh

# Pre-commit hook: Code Review + Documentation Generation
# Blocks on serious issues only
# Auto-generates documentation and commits it

echo ""
echo "🔍 Pre-commit checks running..."
echo ""

node scripts/code-review.js
if [ $? -ne 0 ]; then
  exit 1
fi

node scripts/generate-docs.js

echo "✅ Pre-commit checks passed - ready to commit!"
echo ""
`;
  fs.writeFileSync(hookPath, hookContent);

  // 5. Update package.json scripts
  console.log("📝 Updating package.json scripts...");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts) pkg.scripts = {};
  let changed = false;
  if (!pkg.scripts.review) {
    pkg.scripts.review = "node scripts/code-review.js";
    changed = true;
  }
  if (!pkg.scripts['generate-docs']) {
    pkg.scripts['generate-docs'] = "node scripts/generate-docs.js";
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  // 6. TypeDoc
  const tsConfigPath = path.join(repo, 'tsconfig.json');
  if (fs.existsSync(tsConfigPath) && !pkgStr.includes('"typedoc"')) {
    console.log("📚 Installing typedoc...");
    execSync('npm install typedoc --save-dev', { cwd: repo, stdio: 'inherit' });
  }

  // 7. Gitignore
  const huskyIgnorePath = path.join(huskyDir, '.gitignore');
  if (!fs.existsSync(huskyIgnorePath)) {
    fs.writeFileSync(huskyIgnorePath, "_\\n");
  }

  console.log(`✅ Pre-commit agent deployed successfully to ${path.basename(repo)}!`);
}
