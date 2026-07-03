#!/usr/bin/env node

import { promises as fs } from 'fs';
import { execSync } from 'child_process';

async function autoDocs() {
  try {
    const timestamp = new Date().toISOString();
    const cwd = process.cwd();

    // Detect what changed in last commit
    let diffOutput;
    try {
      diffOutput = execSync('git diff HEAD~1..HEAD --name-status', { encoding: 'utf8' });
    } catch {
      console.log('No prior commits, checking staged changes...');
      diffOutput = execSync('git diff --cached --name-status', { encoding: 'utf8' });
    }

    const files = diffOutput
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [status, ...parts] = line.split('\t');
        return { status, path: parts.join('\t') };
      });

    if (files.length === 0) {
      console.log('✓ No changes detected');
      process.exit(0);
    }

    // Categorize changes
    const categories = new Set();
    files.forEach(f => {
      if (f.path.match(/\.(ts|js)$/)) categories.add('code');
      if (f.path.includes('package.json')) categories.add('dependencies');
      if (f.path.match(/phase|Phase/i)) categories.add('phase');
      if (f.path.match(/schema|json$/)) categories.add('schema');
    });

    const categoryList = Array.from(categories).join(', ') || 'other';
    const changelineNum = files.length;
    const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

    // Build changelog entry
    const entry = `\n## ${timestamp}\n- **Changes:** ${changelineNum} files (${categoryList})\n- **Commit:** ${shortHash}\n- **Files:** ${files.map(f => f.path).join(', ')}\n`;

    // Update CHANGELOG.md
    const changelogPath = `${cwd}/CHANGELOG.md`;
    let changelogContent = '';
    try {
      changelogContent = await fs.readFile(changelogPath, 'utf8');
    } catch {
      changelogContent = '# Changelog\n';
    }

    const newChangelog = changelogContent + entry;
    await fs.writeFile(changelogPath, newChangelog, 'utf8');

    // Stage & commit
    execSync('git add CHANGELOG.md', { cwd });
    const commitMsg = `[automated] Update docs from PR changes (${categoryList})`;
    try {
      execSync(`git commit -m "${commitMsg}"`, { cwd, stdio: 'pipe' });
      const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      console.log(`✓ Auto-docs completed`);
      console.log(`  Commit: ${hash}`);
      console.log(`  Updated: CHANGELOG.md`);
      process.exit(0);
    } catch (error) {
      if (error.message.includes('nothing to commit')) {
        console.log('✓ No doc changes needed');
        process.exit(0);
      }
      throw error;
    }
  } catch (error) {
    console.error('✗ Fatal error:', error.message);
    process.exit(1);
  }
}

autoDocs();
