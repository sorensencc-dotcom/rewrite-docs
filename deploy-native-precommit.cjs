const fs = require('fs');
const path = require('path');

const repos = [
  "C:\\dev\\cic-os",
  "C:\\dev\\claude-skills",
  "C:\\dev\\cic-ingestion",
  "C:\\dev\\charlie-deep-research",
  "C:\\dev\\projects\\cic"
];

const scriptDir = "C:\\Users\\soren\\castironforge\\scripts";

for (const repo of repos) {
  if (!fs.existsSync(repo)) {
    console.log(`Skipping ${repo} - does not exist.`);
    continue;
  }
  
  console.log(`\n======================================================`);
  console.log(`🚀 Deploying native Git hook to ${path.basename(repo)}...`);
  
  const gitHooksDir = path.join(repo, '.git', 'hooks');
  if (!fs.existsSync(gitHooksDir)) {
    console.log(`❌ Error: .git/hooks not found in ${repo}. Is this a git repository?`);
    continue;
  }

  // 1. Copy scripts
  console.log("📋 Setting up pre-commit agent scripts...");
  const targetScriptsDir = path.join(repo, 'scripts');
  if (!fs.existsSync(targetScriptsDir)) fs.mkdirSync(targetScriptsDir, { recursive: true });
  
  fs.copyFileSync(path.join(scriptDir, 'shared-utils.js'), path.join(targetScriptsDir, 'shared-utils.js'));
  fs.copyFileSync(path.join(scriptDir, 'code-review.js'), path.join(targetScriptsDir, 'code-review.js'));
  fs.copyFileSync(path.join(scriptDir, 'generate-docs.js'), path.join(targetScriptsDir, 'generate-docs.js'));

  // 2. Create native pre-commit hook
  console.log("🪝 Installing native .git/hooks/pre-commit...");
  const hookPath = path.join(gitHooksDir, 'pre-commit');
  const hookContent = `#!/bin/sh

# Pre-commit hook: Code Review + Documentation Generation (Native Git Hook)
# Blocks on serious issues only
# Auto-generates documentation and commits it

echo ""
echo "🔍 Pre-commit checks running..."
echo ""

# Run code review (blocks if errors)
node scripts/code-review.js
if [ $? -ne 0 ]; then
  exit 1
fi

# Generate documentation (non-blocking, auto-stages)
node scripts/generate-docs.js

echo "✅ Pre-commit checks passed - ready to commit!"
echo ""
`;
  
  fs.writeFileSync(hookPath, hookContent);
  
  // Note: Windows doesn't use chmod, but we set it anyway if it were running in bash
  try {
    fs.chmodSync(hookPath, '755');
  } catch (e) {
    // Ignore chmod errors on Windows
  }

  console.log(`✅ Native pre-commit agent deployed successfully to ${path.basename(repo)}!`);
}
