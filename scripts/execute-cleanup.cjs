#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
let changesLog = [];

function log(msg) {
  console.log(msg);
  changesLog.push(msg);
}

function gitIgnore(dir, rules) {
  const filePath = path.join(dir, '.gitignore');
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  const linesToAdd = rules.filter(r => !content.includes(r));
  if (linesToAdd.length > 0) {
    const newContent = content.trim() + '\n' + linesToAdd.join('\n') + '\n';
    fs.writeFileSync(filePath, newContent);
    log(`✓ Updated .gitignore in ${dir}`);
  }
}

function deleteIfExists(pathToDelete, isDir = false) {
  if (!fs.existsSync(pathToDelete)) return false;

  try {
    if (isDir) {
      fs.rmSync(pathToDelete, { recursive: true, force: true });
    } else {
      fs.unlinkSync(pathToDelete);
    }
    log(`✓ Deleted ${pathToDelete}`);
    return true;
  } catch (e) {
    log(`✗ Failed to delete ${pathToDelete}: ${e.message}`);
    return false;
  }
}

function findFilesWithExt(dir, ext, maxDepth = 10, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFilesWithExt(fullPath, ext, maxDepth, currentDepth + 1));
      } else if (entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // Skip inaccessible dirs
  }
  return results;
}

try {
  log('=== CLEANUP PHASE 0: Fix .gitignore ===');
  gitIgnore(path.join(ROOT, 'cic-ingestion'), ['node_modules/', 'dist/', '.venv/', 'coverage/', '*.log', '.env', '.env.local']);
  gitIgnore(path.join(ROOT, 'toolforge'), ['.env', '.env.local']);
  gitIgnore(path.join(ROOT, 'castironforge'), ['node_modules/', 'dist/', '.env', '*.log']);
  gitIgnore(path.join(ROOT, '_cic-fragments-archive'), ['node_modules/', 'dist/', '.env', '*.log']);
  gitIgnore(path.join(ROOT, 'cic'), ['node_modules/', 'dist/', '.env', '*.log']);
  gitIgnore(path.join(ROOT, 'rewrite-mcp'), ['.env', '.env.local']);

  log('\n=== CLEANUP PHASE 1: Untrack node_modules + large binaries ===');
  try {
    execSync('git rm -r --cached cic-ingestion/node_modules 2>/dev/null || true', { cwd: ROOT });
    log('✓ Untracked cic-ingestion/node_modules from git');
  } catch (e) {
    log(`Note: cic-ingestion/node_modules not tracked or already removed`);
  }

  log('\n=== CLEANUP PHASE 2: Delete shadow directories ===');
  deleteIfExists(path.join(ROOT, '_artifact-fix'), true);
  deleteIfExists(path.join(ROOT, '_cic-fragments-archive'), true);
  deleteIfExists(path.join(ROOT, 'snapshots'), true);

  const worktreesDir = path.join(ROOT, '.claude', 'worktrees');
  if (fs.existsSync(worktreesDir)) {
    const entries = fs.readdirSync(worktreesDir);
    for (const entry of entries) {
      if (entry.startsWith('agent-')) {
        deleteIfExists(path.join(worktreesDir, entry), true);
      }
    }
  }

  log('\n=== CLEANUP PHASE 3: Delete stale logs ===');
  const logDirs = [
    path.join(ROOT, 'logs'),
    path.join(ROOT, '.logs'),
    path.join(ROOT, 'test-logs')
  ];
  for (const dir of logDirs) {
    if (fs.existsSync(dir)) {
      deleteIfExists(dir, true);
    }
  }

  log('\n=== CLEANUP PHASE 4: Clean compiled JS/DTS side-effects ===');
  const dirs = ['scripts', 'governance', 'ingestion', 'messaging', 'routing', 'harvester-bridge', 'runtime'];
  for (const dir of dirs) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;

    const tsFiles = findFilesWithExt(fullDir, '.ts', 5);
    const jsFiles = findFilesWithExt(fullDir, '.js', 5);
    const dtsFiles = findFilesWithExt(fullDir, '.d.ts', 5);

    for (const jsFile of jsFiles) {
      const tsEquivalent = jsFile.replace(/\.js$/, '.ts');
      if (tsFiles.includes(tsEquivalent)) {
        deleteIfExists(jsFile);
      }
    }

    for (const dtsFile of dtsFiles) {
      const tsEquivalent = dtsFile.replace(/\.d\.ts$/, '.ts');
      if (tsFiles.includes(tsEquivalent)) {
        deleteIfExists(dtsFile);
      }
      const mapFile = dtsFile + '.map';
      if (fs.existsSync(mapFile)) {
        deleteIfExists(mapFile);
      }
    }
  }

  log('\n=== CLEANUP PHASE 5: Remove unused dependencies ===');
  const unused = ['@visx/axis', '@visx/group', '@visx/legend', '@visx/scale', '@visx/tooltip', '@visx/xychart', 'd3-scale'];
  for (const dep of unused) {
    try {
      execSync(`npm uninstall ${dep}`, { cwd: ROOT, stdio: 'pipe' });
      log(`✓ Removed unused dep: ${dep}`);
    } catch (e) {
      log(`Note: Could not uninstall ${dep} (may not be installed or already removed)`);
    }
  }

  log('\n=== CLEANUP PHASE 6: Report duplicate utilities ===');
  const utilFiles = ['code-review.js', 'generate-docs.js', 'shared-utils.js'];
  for (const file of utilFiles) {
    const instances = findFilesWithExt(ROOT, path.basename(file, '.js'), 10);
    const matches = instances.filter(f => f.endsWith(file));
    if (matches.length > 1) {
      log(`⚠ Duplicate found: ${file} appears in ${matches.length} locations:`);
      matches.forEach(m => log(`  - ${m}`));
    }
  }

  log('\n=== CLEANUP PHASE 7: Verify git status ===');
  try {
    const status = execSync('git status --short', { cwd: ROOT, encoding: 'utf-8' });
    if (status.trim()) {
      log('Staged/modified files remaining (review before commit):');
      log(status);
    } else {
      log('✓ Git working tree clean');
    }
  } catch (e) {
    log('Could not run git status');
  }

  log('\n=== CLEANUP COMPLETE ===');
  log(`Total actions logged: ${changesLog.length}`);

} catch (e) {
  log(`FATAL: ${e.message}`);
  process.exit(1);
}
