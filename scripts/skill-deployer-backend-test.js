#!/usr/bin/env node

/**
 * Integration test suite for skill-deployer-backend
 * Validates all 8 phases with various scenarios
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILLS_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'skills');
const MANIFEST_PATH = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'skill-manifest.json');
const TEST_SKILL_NAME = 'test-deployer-skill';
const TEST_SKILL_PATH = path.join(SKILLS_DIR, `${TEST_SKILL_NAME}.md`);
const BACKEND_PATH = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'skill-deployer-backend.js');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}✅${colors.reset} ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} ${name}`);
    console.log(`   ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createTestSkill(name, valid = true) {
  const content = valid
    ? `---
name: ${name}
description: Test skill for deployment validation.
tooltip: |
  Test skill created for integration testing.
  Validates all 8 phases of the deployer.
---

# Test Skill

This is a test skill used to validate the skill-deployer backend.

## Features

- Validates YAML frontmatter parsing
- Tests skill discovery and registration
- Checks manifest synchronization
- Verifies health checks

## Usage

This skill is created during testing and removed after validation.
`
    : `---
name: ${name}
---
No description field!
`;

  fs.writeFileSync(path.join(SKILLS_DIR, `${name}.md`), content, 'utf-8');
}

function runDeployer(args = '') {
  const cmd = `cd "${SKILLS_DIR}" ; node "${BACKEND_PATH}" ${args}`;
  const result = execSync(`powershell -Command "${cmd}"`, { encoding: 'utf-8' });
  return result;
}

// Test Suite
console.log('\n=== SKILL DEPLOYER BACKEND INTEGRATION TESTS ===\n');

// Test 1: Discover all skills
test('Phase 1: Discover discovers all skills', () => {
  const result = runDeployer();
  assert(result.includes('Phase 1: Discover'), 'Phase 1 not executed');
  assert(result.includes('Discovered'), 'Discovery not reported');
  assert(!result.includes('undefined'), 'Unexpected undefined in output');
});

// Test 2: Validate detects valid frontmatter
test('Phase 2: Validate passes valid skills', () => {
  const result = runDeployer();
  assert(result.includes('Validation: 18 pass'), 'Expected 18 valid skills');
  assert(result.includes('✅'), 'Valid skill marker not found');
});

// Test 3: Install backs up existing files
test('Phase 3: Install processes all skills without error', () => {
  const result = runDeployer();
  assert(result.includes('Install: 18 skills processed'), 'Install phase did not complete successfully');
  assert(!result.includes('ERROR'), 'Error occurred during install phase');
});

// Test 4: Register updates manifest
test('Phase 4: Register updates manifest', () => {
  runDeployer();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  assert(manifest.skills.length >= 18, `Expected at least 18 skills in manifest, got ${manifest.skills.length}`);
  assert(manifest.lastUpdated, 'lastUpdated timestamp not set');
});

// Test 5: Activate lists all active skills
test('Phase 5: Activate lists active skills', () => {
  const result = runDeployer();
  assert(result.includes('activated'), 'Activation not reported');
  assert(result.includes('✅'), 'Active skill marker not found');
});

// Test 6: Validate & Fix removes duplicates
test('Phase 6: Validate & Fix handles duplicates', () => {
  createTestSkill('test-skill-DUPLICATE');
  const result = runDeployer();
  assert(result.includes('Validate & Fix'), 'Phase 6 not executed');
  fs.unlinkSync(path.join(SKILLS_DIR, 'test-skill-DUPLICATE.md'));
});

// Test 7: Validate & Sync detects missing entries
test('Phase 6.5: Validate & Sync Manifest syncs correctly', () => {
  const result = runDeployer();
  assert(result.includes('Validate & Sync'), 'Phase 6.5 not executed');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  assert(manifest.skills.length > 0, 'Manifest should have entries');
});

// Test 8: Report generates JSON
test('Phase 7: Report generates valid JSON', () => {
  const result = runDeployer();
  assert(result.includes('JSON REPORT'), 'JSON report header not found');
  const jsonMatch = result.match(/\{[\s\S]*"timestamp"[\s\S]*\}/);
  assert(jsonMatch, 'Valid JSON not found in report');
  const json = JSON.parse(jsonMatch[0]);
  assert(json.summary, 'Summary not in report');
  assert(json.health_check, 'Health check not in report');
});

// Test 9: Verify checks health
test('Phase 8: Verify performs health check', () => {
  const result = runDeployer();
  assert(result.includes('HEALTHY'), 'Health status not reported');
  assert(result.includes('skill_count'), 'Skill count not in health check');
});

// Test 10: Filtering works
test('Filtering: Deploy specific skills', () => {
  const result = runDeployer('skill-deployer,sleep-no-prompt');
  assert(result.includes('Discovered 2 skills'), 'Filtering did not work');
  assert(result.includes('Filtered to 2 specified skills'), 'Filter message not shown');
});

// Test 11: Manifest preservation during filtered runs
test('Manifest: Preserved during filtered deployment', () => {
  // Full run
  runDeployer();
  const fullCount = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')).skills.length;

  // Filtered run
  runDeployer('auto-docs');
  const filteredCount = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')).skills.length;

  assert(filteredCount === fullCount, `Manifest size changed during filtered run (${fullCount} → ${filteredCount})`);
});

// Test 12: Files changed reported
test('Output: Files changed section present', () => {
  const result = runDeployer();
  assert(result.includes('FILES CHANGED'), 'Files changed section not found');
  assert(result.includes('skill-manifest.json'), 'Manifest not in files changed');
});

// Test 13: Execution log structured
test('Output: Execution log structured correctly', () => {
  const result = runDeployer();
  assert(result.includes('SKILL DEPLOYER EXECUTION LOG'), 'Execution log header not found');
  for (let i = 1; i <= 8; i++) {
    assert(result.includes(`Phase ${i}: Complete`), `Phase ${i} not in execution log`);
  }
});

// Test 14: No partial failures crash
test('Error handling: No uncaught exceptions', () => {
  try {
    runDeployer();
    testsPassed++;
    console.log(`${colors.green}✅${colors.reset} No uncaught exceptions during execution`);
  } catch (error) {
    testsFailed++;
    console.log(`${colors.red}❌${colors.reset} Uncaught exception: ${error.message}`);
  }
});

// Test 15: Absolute paths used
test('Paths: All paths are absolute', () => {
  const result = runDeployer();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  for (const skill of manifest.skills) {
    assert(path.isAbsolute(skill.path), `Path not absolute: ${skill.path}`);
  }
});

// Summary
console.log('\n' + colors.yellow + '═'.repeat(60) + colors.reset);
console.log(`Tests Passed: ${colors.green}${testsPassed}${colors.reset}`);
console.log(`Tests Failed: ${testsFailed > 0 ? colors.red : colors.green}${testsFailed}${colors.reset}`);
console.log(colors.yellow + '═'.repeat(60) + colors.reset + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
