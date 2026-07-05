# Gemini Repository Hygiene Audit Report

**Date**: 2026-07-04  
**Target Workspace**: `C:\dev` (sorensencc-dotcom / rewrite-docs)  
**Auditor**: Antigravity  

---

## Executive Summary
A comprehensive hygiene audit was performed recursively across all directories in the `C:\dev` workspace, including submodules (`toolforge`), nested repositories (`cic-ingestion`, `charlie-deep-research`, `cic`, `claude-skills`, `rewrite-mcp`, `CIP/CIC`), and local modules. 

The audit scanned 27,290 files and identified significant opportunities for structural improvement, repository size reduction, and path consolidation. Key issues include:
1. **Severe gitignore exclusions failure**: Nested repositories like `cic-ingestion` have accidentally tracked `node_modules/` sub-directories, leading to bloated Git history (e.g., tracking typescript compiler binaries and SQLite native addons in Git).
2. **Shadow/Junk Directory Sprawl**: Over **150MB** of space is consumed by legacy experimental and recovery directories (`_artifact-fix`, `_cic-fragments-archive`, and orphaned `.claude/worktrees`).
3. **Out-of-place Compiled Assets**: 834 untracked compiled JavaScript files (`.js`, `.d.ts`, `.d.ts.map`) clutter the source folders due to in-place compilation.
4. **Duplicate Utility Scripts**: High-risk script duplication (e.g., identical copies of `code-review.js`, `generate-docs.js`, and `shared-utils.js`) across 6 repositories.

---

## Consolidated Audit Findings

### 1. Incomplete & Missing .gitignore Patterns
* **Severity**: Critical
* **Files/Paths**: 
  - `C:\dev\cic-ingestion\.gitignore` (Incomplete - missing `.env`, `dist/`, `.venv`, `coverage/`, `*.log`)
  - `C:\dev\claude-configs\` (No `.gitignore` - missing entirely)
  - `C:\dev\castironforge\` (No `.gitignore` - missing entirely)
  - `C:\dev\cic\` (No `.gitignore` - missing entirely)
  - `C:\dev\rewrite-mcp\.gitignore` (Incomplete)
  - `C:\dev\toolforge\.gitignore` (Incomplete)
* **Description**: Missing or incomplete `.gitignore` configs have allowed local environment files (`.env`), build directories (`dist/`, `build/`), python virtual environments (`.venv`), and node packages to leak into tracked status.
* **Remediation**: Copy the root `.gitignore` configuration to each sub-repo, and untrack any leaked files.

---

### 2. Large Binaries and Accidental Git Check-ins
* **Severity**: High
* **Files/Paths**:
  - `C:\dev\snapshots\cip-rewritelabs-snapshot-2026-06-19.tar.gz` (21.96MB) - **Tracked**
  - `C:\dev\snapshots\planning-engine-snapshot-2026-06-19.tar.gz` (20.19MB) - **Tracked**
  - `C:\dev\castironforge\torque-query\storage\chroma\chroma.sqlite3` (4.75MB) - **Tracked**
  - `C:\dev\docs-manager\docs-audit-report.json` (2.05MB) - **Tracked**
  - `C:\dev\docs-manager\docs-drift-report.json` (1.48MB) - **Tracked**
  - `C:\dev\cic-ingestion\node_modules\typescript\lib\typescript.js` (8.69MB) - **Tracked (Accidental node_modules leak)**
  - `C:\dev\cic-ingestion\node_modules\typescript\lib\_tsc.js` (5.93MB) - **Tracked**
  - `C:\dev\cic-ingestion\node_modules\better-sqlite3\deps\sqlite3\sqlite3.c` (9.07MB) - **Tracked**
* **Description**: Large archive files, localized SQLite databases, and third-party node module source code are actively tracked inside Git history, severely bloating cloning times.
* **Remediation**: Run `git rm --cached` on these files, add them to `.gitignore`, and use `git filter-repo` or BFG to prune them from past commit history.

---

### 3. Unbounded or Stale Log Files
* **Severity**: Medium
* **Files/Paths**:
  - `C:\dev\test-output.log` (965.6KB)
  - `C:\dev\final-test.log` (333.3KB)
  - `C:\dev\test-final.log` (330.9KB)
  - `C:\dev\bootstrap-sorensencc-dotcom-*.log` (13 distinct files, 55KB total)
  - `C:\dev\cic-boot.log` / `C:\dev\cic-boot.log.err` (0KB - empty log clutter)
* **Description**: Leftover runtime logs from previous test runs and boot attempts clutter the root working directory. 
* **Remediation**: Delete stale logs and empty log files. Ensure all testing scripts redirect logs to a central, git-ignored `logs/` directory.

---

### 4. Inconsistent Naming Conventions
* **Severity**: Low
* **Files/Paths**: 
  - `docs/` folder (208 files violating `lowercase-with-hyphens.md` rule)
    - *Example*: `docs/00-EIGHT-ITEM-BUILD-PLAN.md` -> should be `00-eight-item-build-plan.md`
    - *Example*: `docs/cic/BATCH-MAP-1-40-STATUS.md` -> should be `batch-map-1-40-status.md`
    - *Example*: `docs/cic/CANARY_GATES.md` -> should be `canary-gates.md`
  - `toolforge/skills/` (8 skill directories violating kebab-case)
    - *Example*: `toolforge/skills/_TEMPLATE` -> exception allowed, but check for uppercase/snake_case skills.
* **Description**: Document and directory naming deviates from the patterns defined in `CLAUDE.md`.
* **Remediation**: Rename markdown files in `docs/` to follow the `lowercase-with-hyphens.md` format and update their references in `mkdocs.yml`.

---

### 5. Outdated or Unused Dependencies
* **Severity**: Medium
* **Files/Paths**:
  - `C:\dev\package.json` (Root)
    - Unused: `@visx/axis`, `@visx/group`, `@visx/legend`, `@visx/scale`, `@visx/tooltip`, `@visx/xychart`, `d3-scale`, `react`, `react-dom`, `zustand`
  - `C:\dev\rewrite-mcp\projects\cic-operator-console\package.json`
    - Unused: `axios`, `autoprefixer`, `postcss`
* **Description**: The root `package.json` defines itself as `cic-agent-runtime` (a backend orchestrator), but includes heavy visual packages like `@visx` and `react` that are never imported anywhere in the project scope.
* **Remediation**: Run `npm uninstall` for the unused packages in the respective modules to slim down the dependency tree.

---

### 6. Redundant package.json Scripts
* **Severity**: Low
* **Files/Paths**:
  - `C:\dev\package.json` (Root) vs `C:\dev\rewrite-mcp\package.json` vs `C:\dev\castironforge\package.json`
    - Duplicate scripts: `"review": "node scripts/code-review.js"` and `"generate-docs": "node scripts/generate-docs.js"` are copied across multiple repos.
  - Submodule scripts:
    - `"build": "tsc"` is identically declared across 40+ package.jsons.
* **Description**: Local copies of administrative scripts have led to duplicate command block definitions in various project directories.
* **Remediation**: Centralize scripts to the root `package.json` or use `npm run` work-spaces configurations to run commands globally.

---

### 7. Missing READMEs in Module Directories
* **Severity**: Medium
* **Files/Paths**:
  - 28 folders under `services/`, `rewrite-mcp/apps/`, and `rewrite-mcp/packages/`
    - *Example*: `services/torquequery`, `services/vault`, `services/unified-api`, `services/cic-governance`
    - *Example*: `rewrite-mcp/apps/ai-os`, `rewrite-mcp/packages/agents`
* **Description**: Key services and modules lack any basic quickstart documentation or structural description, harming developer onboarding.
* **Remediation**: Generate standardized `README.md` files for all 28 identified directories containing a description of the module, its interface, and run instructions.

---

### 8. Missing tsconfig References
* **Severity**: Medium
* **Files/Paths**:
  - 37 TS project folders including `ingestion/`, `routing/`, `governance/`, `messaging/`, `harvester-bridge/`
* **Description**: Several folders containing `.ts` files lack a local `tsconfig.json` and are compiled in-place by the root config, causing build outputs (`.js`, `.d.ts`) to be emitted directly inside the source folders.
* **Remediation**: Set up local `tsconfig.json` configurations inheriting from the root, or ensure that their output is properly ignored by Git if they are built in-place.

---

### 9. Orphaned Modules with No Imports
* **Severity**: High
* **Files/Paths**:
  - `C:\dev\governance\audit-policy.ts`
  - `C:\dev\governance\promotion-rollback.ts`
  - `C:\dev\harvester-bridge\resolver.ts`
  - `C:\dev\ingestion\multi-pipeline-orchestrator.ts`
  - `C:\dev\ingestion\operator-console-view.ts`
  - `C:\dev\ingestion\trace-emitter.ts`
  - `C:\dev\ingestion\unified-ingestion-adapter.ts`
  - `C:\dev\messaging\local-first-bus.ts`
  - `C:\dev\routing\local-first-router.ts`
  - `C:\dev\runtime\config\runtime-config.ts`
  - `C:\dev\scripts\cicCostComputePdf.ts`
  - `C:\dev\src\validation\guards.ts`
* **Description**: These 12 source files have exactly 0 incoming imports or references across the entire codebase. They either represent unfinished features or deprecated code.
* **Remediation**: Review each file with the team. If they are obsolete, delete them along with their in-place compiled JS counterparts.

---

### 10. Unused Files & Dead Code Paths
* **Severity**: Medium
* **Files/Paths**:
  - Compiled outputs next to the 12 orphaned modules (e.g. `governance/audit-policy.js`, `harvester-bridge/resolver.js`, etc.)
* **Description**: Compilation side-effects are left in the source folders, cluttering searches and consuming workspace space.
* **Remediation**: Run a cleanup script to clear all in-place generated JS/DTS files.

---

### 11. Duplicated Utilities or Logic
* **Severity**: High
* **Files/Paths**:
  - `scripts/code-review.js`, `scripts/generate-docs.js`, `scripts/shared-utils.js` (Duplicated in: `castironforge/`, `charlie-deep-research/`, `cic-ingestion/`, `claude-skills/`, `rewrite-mcp/`)
  - `.claude/worktrees/agent-*/scripts/` (Scripts like `cic-dry-run.sh`, `cic-log-archival.sh`, `cic-smoke-test.sh` are duplicated in every active worktree)
* **Description**: Identical administrative files have been copied into multiple folders instead of being imported from a shared scripts repository.
* **Remediation**: Delete duplicates in nested repositories and reference the root versions, or create a single symlink structure.

---

### 12. Shadow Directories from Old Experiments
* **Severity**: High
* **Files/Paths**:
  - `C:\dev\_artifact-fix\` (71MB - obsolete duplicates of repos)
  - `C:\dev\_cic-fragments-archive\` (Obsolete duplicates)
  - `C:\dev\snapshots\` (42.2MB - old backup files)
  - `C:\dev\**\.claude\worktrees\agent-*` (Leftover temporary worktrees)
* **Description**: Legacy migration folders and agent recovery directories from past sessions are left in the workspace.
* **Remediation**: Delete `_artifact-fix`, `_cic-fragments-archive`, and old `worktrees` directories to free up workspace space.

---

## Suggested Cleanup Scripts

### 1. General Workspace Cleanup Script (Node.js)
Save this script as `C:\dev\scripts\safe-workspace-clean.cjs` and run it to clear out stale logs, empty logs, and compiled JS files next to TS sources:

```javascript
const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\dev';

// 1. Delete Stale Logs
console.log('Cleaning logs...');
const logExtensions = ['.log', '.log.err'];
function cleanLogs(dir) {
  let files;
  try { files = fs.readdirSync(dir); } catch(e) { return; }
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') cleanLogs(filePath);
    } else if (logExtensions.includes(path.extname(file)) || file.startsWith('bootstrap-sorensencc-dotcom-')) {
      console.log(`Deleting log: ${path.relative(ROOT_DIR, filePath)}`);
      fs.unlinkSync(filePath);
    }
  });
}
cleanLogs(ROOT_DIR);

// 2. Clean in-place compiled JS/DTS files where a TS counterpart exists
console.log('\nCleaning in-place compiled outputs...');
function cleanCompiledOutputs(dir) {
  let files;
  try { files = fs.readdirSync(dir); } catch(e) { return; }
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        cleanCompiledOutputs(filePath);
      }
    } else if (filePath.endsWith('.js') || filePath.endsWith('.d.ts') || filePath.endsWith('.d.ts.map')) {
      const tsPath = filePath.replace(/\.js$/, '.ts').replace(/\.d\.ts$/, '.ts').replace(/\.d\.ts\.map$/, '.ts');
      if (fs.existsSync(tsPath)) {
        console.log(`Deleting compiled side-effect: ${path.relative(ROOT_DIR, filePath)}`);
        fs.unlinkSync(filePath);
      }
    }
  });
}
cleanCompiledOutputs(ROOT_DIR);
console.log('\nCleanup Complete!');
```

### 2. Git History Optimization Commands (Bash)
Run these commands within `C:\dev\cic-ingestion` to fix the tracked `node_modules` leak and untrack files:

```bash
# 1. Untrack accidentally tracked node_modules
git rm -r --cached node_modules/

# 2. Add node_modules to local .gitignore
echo "node_modules/" >> .gitignore

# 3. Commit the change
git commit -m "chore: untrack node_modules and update gitignore"
```

To clean up shadow directories globally in the main workspace:

```bash
# Remove shadow folders from git (if they are tracked) or disk
rm -rf C:/dev/_artifact-fix
rm -rf C:/dev/_cic-fragments-archive
rm -rf C:/dev/snapshots/cip-*.tar.gz
rm -rf C:/dev/snapshots/planning-*.tar.gz
```
