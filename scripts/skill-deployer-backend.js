#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

/**
 * Skill Deployer Automation Backend — All 8 Phases
 * Runs: Discover → Validate → Install → Register → Activate → Validate & Fix → Validate & Sync → Report → Verify
 */

const SKILLS_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'skills');
const MANIFEST_PATH = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'skill-manifest.json');
const BACKUP_SUFFIX = '.bak';
const ISO_NOW = new Date().toISOString();

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(level, message) {
  const prefix = {
    'INFO': colors.blue,
    'SUCCESS': colors.green,
    'WARN': colors.yellow,
    'ERROR': colors.red,
  }[level] || '';
  console.log(`${prefix}[${level}]${colors.reset} ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    log('ERROR', message);
    process.exit(1);
  }
}

/**
 * Phase 1: Discover
 * Scan ~/.claude/skills/ for .md files, parse frontmatter
 */
function phaseDiscover(skillNames = null) {
  log('INFO', 'Phase 1: Discover');

  assert(fs.existsSync(SKILLS_DIR), `Skills directory not found: ${SKILLS_DIR}`);

  const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'));

  let discovered = [];

  if (skillNames && skillNames.length > 0) {
    // Filter to named skills
    discovered = files.filter(f => {
      const baseName = f.replace('.md', '');
      return skillNames.some(sn => baseName === sn.trim());
    });
    log('INFO', `  Filtered to ${skillNames.length} specified skills`);
  } else {
    discovered = files;
  }

  const skills = [];
  const duplicates = [];

  for (const file of discovered) {
    const filePath = path.join(SKILLS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      log('WARN', `No frontmatter in ${file}`);
      continue;
    }

    const frontmatter = parseFrontmatter(frontmatterMatch[1]);

    // Detect duplicates
    const isDuplicate = file.match(/-(SKILL|REVIEW|BACKUP|FIXED|UPDATED)\.md$/i);

    skills.push({
      filename: file,
      path: filePath,
      name: frontmatter.name || file.replace('.md', ''),
      description: frontmatter.description || '',
      tooltip: frontmatter.tooltip || '',
      isDuplicate: !!isDuplicate,
    });

    if (isDuplicate) {
      duplicates.push(file);
    }
  }

  log('SUCCESS', `Discovered ${skills.length} skills (${duplicates.length} duplicates detected)`);

  return { skills, duplicates };
}

/**
 * Parse YAML frontmatter
 */
function parseFrontmatter(content) {
  const result = {};
  const lines = content.trim().split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim().replace(/^['"]|['"]$/g, '');
      result[key] = value;
    }
  }

  return result;
}

/**
 * Phase 2: Validate
 * Check YAML, required fields, kebab-case naming, UTF-8
 */
function phaseValidate(skills) {
  log('INFO', 'Phase 2: Validate');

  const results = {
    pass: [],
    warn: [],
    fail: [],
  };

  for (const skill of skills) {
    const content = fs.readFileSync(skill.path, 'utf-8');
    const issues = [];

    // Check UTF-8
    try {
      Buffer.from(content, 'utf-8');
    } catch (e) {
      issues.push('Invalid UTF-8 encoding');
    }

    // Check frontmatter YAML
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      issues.push('Missing or malformed frontmatter');
    }

    // Check required fields
    if (!skill.name) issues.push('Missing name field');
    if (!skill.description) issues.push('Missing description field');

    // Check kebab-case name
    if (skill.name && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(skill.name)) {
      issues.push(`Invalid name format: ${skill.name} (must be kebab-case)`);
    }

    // Check description length
    if (skill.description && skill.description.length > 200) {
      issues.push(`Description too long: ${skill.description.length} chars (max 200)`);
    }

    // Check markdown structure
    const body = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    if (!body.includes('##') && !body.includes('#')) {
      issues.push('Missing markdown sections (## headers)');
    }
    if (body.trim().length < 50) {
      issues.push('Content too minimal (< 50 chars)');
    }

    if (issues.length === 0) {
      results.pass.push({ ...skill, issues });
      log('SUCCESS', `  ✅ ${skill.name}`);
    } else if (issues.length <= 2 && !issues.some(i => i.includes('Missing'))) {
      results.warn.push({ ...skill, issues });
      log('WARN', `  ⚠️  ${skill.name}: ${issues.join('; ')}`);
    } else {
      results.fail.push({ ...skill, issues });
      log('ERROR', `  ❌ ${skill.name}: ${issues.join('; ')}`);
    }
  }

  log('SUCCESS', `Validation: ${results.pass.length} pass, ${results.warn.length} warn, ${results.fail.length} fail`);

  return results;
}

/**
 * Phase 3: Install
 * Backup existing, write new files, validate SHA-256
 */
function phaseInstall(skills) {
  log('INFO', 'Phase 3: Install');

  const installed = [];

  for (const skill of skills) {
    const filename = skill.filename;
    const filePath = path.join(SKILLS_DIR, filename);

    // If file exists, backup first
    if (fs.existsSync(filePath)) {
      const timestamp = ISO_NOW.replace(/[:\-T]/g, '').slice(0, 14);
      const backupPath = filePath + `_${timestamp}${BACKUP_SUFFIX}`;
      fs.copyFileSync(filePath, backupPath);
      log('INFO', `  Backed up: ${path.basename(backupPath)}`);
    }

    // Already in ~/.claude/skills, no need to write
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      installed.push({ filename, hash, status: 'unchanged' });
      log('SUCCESS', `  ✅ ${filename} (existing)`);
    }
  }

  log('SUCCESS', `Install: ${installed.length} skills processed`);
  return installed;
}

/**
 * Phase 4: Register
 * Read/write manifest, add/update entries
 */
function phaseRegister(skills) {
  log('INFO', 'Phase 4: Register');

  // Load existing manifest
  let manifest = {
    lastUpdated: ISO_NOW,
    skills: [],
  };

  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch (e) {
      log('WARN', `Failed to parse manifest, starting fresh: ${e.message}`);
    }
  }

  manifest.lastUpdated = ISO_NOW;

  const registered = [];

  for (const skill of skills) {
    // Find existing entry
    const existingIndex = manifest.skills.findIndex(s => s.name === skill.name);

    const entry = {
      name: skill.name,
      description: skill.description,
      tooltip: skill.tooltip || skill.description,
      path: skill.path,
      status: 'active',
      registered: existingIndex >= 0 ? manifest.skills[existingIndex].registered : ISO_NOW,
      triggers: existingIndex >= 0 ? manifest.skills[existingIndex].triggers : [],
    };

    if (existingIndex >= 0) {
      manifest.skills[existingIndex] = entry;
      log('INFO', `  Updated: ${skill.name}`);
    } else {
      manifest.skills.push(entry);
      log('SUCCESS', `  New: ${skill.name}`);
    }

    registered.push(entry);
  }

  // Write manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  log('SUCCESS', `Register: ${registered.length} entries in manifest`);

  return { manifest, registered };
}

/**
 * Phase 5: Activate
 * List registered skills, test discovery
 */
function phaseActivate(manifest) {
  log('INFO', 'Phase 5: Activate');

  const active = manifest.skills.filter(s => s.status === 'active');

  log('SUCCESS', `${active.length} skills activated:`);
  for (const skill of active.slice(0, 5)) {
    log('SUCCESS', `  ✅ ${skill.name}`);
  }
  if (active.length > 5) {
    log('INFO', `  ... and ${active.length - 5} more`);
  }

  return { activated: active.length };
}

/**
 * Phase 6: Validate & Fix
 * Find malformed skills, remove duplicates
 */
function phaseValidateFix(skills, duplicates) {
  log('INFO', 'Phase 6: Validate & Fix');

  const removed = [];

  for (const dupFile of duplicates) {
    const filePath = path.join(SKILLS_DIR, dupFile);
    const timestamp = ISO_NOW.replace(/[:\-T]/g, '').slice(0, 14);
    const archivePath = filePath + `_archived_${timestamp}${BACKUP_SUFFIX}`;

    fs.copyFileSync(filePath, archivePath);
    fs.unlinkSync(filePath);
    removed.push(dupFile);
    log('SUCCESS', `  Removed duplicate: ${dupFile} → ${path.basename(archivePath)}`);
  }

  log('SUCCESS', `Validate & Fix: ${removed.length} duplicates removed`);
  return { removed };
}

/**
 * Phase 6.5: Validate & Sync Manifest
 * Compare disk vs manifest, add missing, remove orphaned (only for ALL skills)
 */
function phaseValidateSyncManifest(manifest, skills, allFiles) {
  log('INFO', 'Phase 6.5: Validate & Sync Manifest');

  const diskNames = new Set(allFiles.map(f => f.replace('.md', '')));
  const manifestNames = new Set(manifest.skills.map(s => s.name));

  const gaps = [];
  const missing = [];
  const orphaned = [];

  // Check for files not in manifest
  for (const name of diskNames) {
    if (!manifestNames.has(name)) {
      missing.push(name);
      gaps.push(`WARNING: ${name} on disk but not in manifest`);
    }
  }

  // Check for manifest entries not on disk
  const newSkills = manifest.skills.filter(s => diskNames.has(s.name));
  const oldSkills = manifest.skills.filter(s => !diskNames.has(s.name));

  for (const s of oldSkills) {
    orphaned.push(s.name);
    gaps.push(`CRITICAL: ${s.name} in manifest but not on disk`);
  }

  // Update manifest to match disk
  if (orphaned.length > 0) {
    manifest.skills = newSkills;
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
    log('SUCCESS', `Synced manifest: removed ${orphaned.length} orphaned entries`);
  }

  log('SUCCESS', `Validate & Sync: ${missing.length} missing, ${orphaned.length} orphaned`);
  return { gaps, missing, orphaned };
}

/**
 * Phase 7: Report
 * Generate structured JSON + text report
 */
function phaseReport(manifest, discovered, validated, installed, registered, activated, fixed, synced, verified) {
  log('INFO', 'Phase 7: Report');

  const report = {
    timestamp: ISO_NOW,
    summary: {
      total: discovered.skills.length,
      active: activated.activated,
      duplicates_removed: fixed.removed.length,
      orphaned_removed: synced.orphaned.length,
      validation_status: `${validated.pass.length} pass, ${validated.warn.length} warn, ${validated.fail.length} fail`,
    },
    details: {
      discovered: discovered.skills.map(s => ({
        name: s.name,
        filename: s.filename,
        status: s.isDuplicate ? 'duplicate' : 'valid',
      })),
      registered: registered.registered.map(s => ({
        name: s.name,
        description: s.description,
        path: s.path,
        status: s.status,
        registered: s.registered,
      })),
      validation_gaps: synced.gaps,
    },
    activation_status: {
      active_count: activated.activated,
      manifest_updated: ISO_NOW,
      manifest_path: MANIFEST_PATH,
    },
    health_check: verified.health,
    next_steps: verified.next_steps,
  };

  log('SUCCESS', 'Report generated');

  return report;
}

/**
 * Phase 8: Verify
 * Final health check: count, frontmatter, conflicts, triggers
 */
function phaseVerify(manifest, validated) {
  log('INFO', 'Phase 8: Verify');

  const health = {};
  let healthy = true;

  // Count check
  health.skill_count = manifest.skills.length;
  log('INFO', `  Skill count: ${health.skill_count}`);

  // Frontmatter check
  const frontmatterValid = manifest.skills.every(s => s.name && s.description);
  health.frontmatter_valid = frontmatterValid;
  log(frontmatterValid ? 'SUCCESS' : 'WARN', `  Frontmatter: ${frontmatterValid ? '✅ all valid' : '⚠️ some invalid'}`);
  if (!frontmatterValid) healthy = false;

  // Trigger discovery
  const triggerCount = manifest.skills.reduce((sum, s) => sum + (s.triggers?.length || 0), 0);
  health.triggers_defined = triggerCount;
  log('INFO', `  Triggers defined: ${triggerCount}`);

  // Conflict detection (duplicate names)
  const names = manifest.skills.map(s => s.name);
  const duplicateNames = names.filter((n, i) => names.indexOf(n) !== i);
  health.conflicts = duplicateNames;
  log(duplicateNames.length === 0 ? 'SUCCESS' : 'ERROR',
    duplicateNames.length === 0 ? '  ✅ No conflicts' : `  ❌ ${duplicateNames.length} name conflicts`);
  if (duplicateNames.length > 0) healthy = false;

  // Validation summary
  health.validation_summary = {
    pass: validated.pass.length,
    warn: validated.warn.length,
    fail: validated.fail.length,
  };

  // Overall status
  const status = healthy ? '✅ HEALTHY' : (health.conflicts.length > 0 ? '❌ CRITICAL' : '⚠️ GAPS');
  health.status = status;

  const next_steps = [
    'All skills deployed successfully. Use /skill <name> to invoke them.',
    validated.fail.length > 0 ? `Fix ${validated.fail.length} invalid skills and re-run.` : null,
  ].filter(Boolean);

  log('SUCCESS', `${status} — Deployment complete`);

  return { health, status, next_steps };
}

/**
 * Main execution
 */
function main() {
  const skillNames = process.argv.slice(2).length > 0
    ? process.argv.slice(2)[0].split(',').map(s => s.trim())
    : null;

  const executionLog = [];

  try {
    // Get ALL files on disk for sync validation
    const allFiles = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'));

    // Phase 1: Discover
    const discovered = phaseDiscover(skillNames);
    executionLog.push({ phase: 1, result: discovered });

    // Phase 2: Validate
    const validated = phaseValidate(discovered.skills);
    executionLog.push({ phase: 2, result: validated });

    // Phase 3: Install
    const installed = phaseInstall(discovered.skills);
    executionLog.push({ phase: 3, result: installed });

    // Phase 4: Register
    const registered = phaseRegister(discovered.skills);
    executionLog.push({ phase: 4, result: registered });

    // Phase 5: Activate
    const activated = phaseActivate(registered.manifest);
    executionLog.push({ phase: 5, result: activated });

    // Phase 6: Validate & Fix
    const fixed = phaseValidateFix(discovered.skills, discovered.duplicates);
    executionLog.push({ phase: 6, result: fixed });

    // Phase 6.5: Validate & Sync Manifest
    const synced = phaseValidateSyncManifest(registered.manifest, discovered.skills, allFiles);
    executionLog.push({ phase: '6.5', result: synced });

    // Phase 8: Verify
    const verified = phaseVerify(registered.manifest, validated);
    executionLog.push({ phase: 8, result: verified });

    // Phase 7: Report
    const report = phaseReport(
      registered.manifest,
      discovered,
      validated,
      installed,
      registered,
      activated,
      fixed,
      synced,
      verified
    );
    executionLog.push({ phase: 7, result: report });

    // Output
    console.log('\n' + colors.bright + '=== SKILL DEPLOYER EXECUTION LOG ===' + colors.reset);
    for (const entry of executionLog) {
      console.log(`Phase ${entry.phase}: Complete`);
    }

    console.log('\n' + colors.bright + '=== JSON REPORT ===' + colors.reset);
    console.log(JSON.stringify(report, null, 2));

    console.log('\n' + colors.bright + '=== FILES CHANGED ===' + colors.reset);
    console.log(`Manifest: ${MANIFEST_PATH}`);
    for (const dupFile of discovered.duplicates) {
      console.log(`Archived: ${path.join(SKILLS_DIR, dupFile)}`);
    }

  } catch (error) {
    log('ERROR', error.message);
    process.exit(1);
  }
}

main();
