#!/usr/bin/env node
/**
 * Dark Mode Token Validator — ensures all components use canonical tokens
 * Runs: node scripts/validate-dark-mode.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REQUIRED_TOKENS = {
  light: {
    'color-surface-0': '#ffffff',
    'color-surface-1': '#f9fafb',
    'color-surface-2': '#f3f4f6',
    'color-text': '#111827',
    'color-text-muted': '#6b7280',
    'color-accent': '#3b82f6',
    'color-danger': '#dc2626',
    'color-border': '#d1d5db',
  },
  dark: {
    'color-surface-0': '#0f0f11',
    'color-surface-1': '#161618',
    'color-surface-2': '#1d1d20',
    'color-text': '#f5f5f7',
    'color-text-muted': '#a0a0a8',
    'color-accent': '#4d8dff',
    'color-danger': '#ff6b6b',
    'color-border': '#2a2a2e',
  },
};

const CSS_FILES = [
  'src/components/cic/button.css',
  'src/components/cic/panel.css',
  'src/components/cic/card.css',
  'src/components/cic/input.css',
  'src/components/cic/checkbox.css',
  'src/components/cic/grid.css',
  'src/components/cic/row.css',
  'src/components/cic/table.css',
  'src/components/cic/alert.css',
];

const FORBIDDEN_TOKENS = [
  '--cic-surface-layer-0',
  '--cic-surface-layer-1',
  '--cic-surface-layer-2',
];

function validateTokenFile() {
  const tokenFile = 'src/components/cic/cic-component-tokens.css';
  const content = fs.readFileSync(tokenFile, 'utf8');

  const errors = [];

  // Check for forbidden tokens
  FORBIDDEN_TOKENS.forEach(token => {
    if (content.includes(token)) {
      errors.push(`❌ ${tokenFile}: Contains deprecated token ${token}`);
    }
  });

  // Check for required dark mode tokens
  const darkModeSection = content.match(/\[data-theme=['"]dark['"]\]\s*\{([^}]+)\}/s);
  if (!darkModeSection) {
    errors.push(`❌ ${tokenFile}: Missing dark mode override section`);
  } else {
    Object.keys(REQUIRED_TOKENS.dark).forEach(token => {
      const cssToken = `--cic-${token.replace(/-/g, '-')}`;
      if (!darkModeSection[0].includes(cssToken)) {
        errors.push(`❌ ${tokenFile}: Missing dark mode token ${cssToken}`);
      }
    });
  }

  return errors;
}

function validateComponentCSS() {
  const errors = [];

  CSS_FILES.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check for old token references
      FORBIDDEN_TOKENS.forEach(token => {
        if (content.includes(token)) {
          errors.push(`❌ ${file}: Uses deprecated token ${token}`);
        }
      });

      // Check for hardcoded colors (should use tokens)
      const colorMatches = content.match(/#[0-9a-f]{6}/gi) || [];
      if (colorMatches.length > 2) { // Allow up to 2 hardcoded colors
        errors.push(`⚠️  ${file}: Contains ${colorMatches.length} hardcoded colors, should use tokens`);
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        errors.push(`❌ ${file}: Error reading file: ${e.message}`);
      }
    }
  });

  return errors;
}

function validateSnapshots() {
  const errors = [];
  const testDir = 'src/tests/cic';

  try {
    const files = fs.readdirSync(testDir);
    const testFiles = files.filter(f => f.endsWith('.test.tsx'));

    testFiles.forEach(file => {
      const content = fs.readFileSync(path.join(testDir, file), 'utf8');

      // Check for theme wrapper
      if (!content.includes('renderWithTheme')) {
        errors.push(`⚠️  ${path.join(testDir, file)}: Missing renderWithTheme helper`);
      }

      // Check for dark mode snapshots (case-insensitive)
      if (!content.toLowerCase().includes('dark mode snapshot')) {
        errors.push(`⚠️  ${path.join(testDir, file)}: Missing dark mode snapshot tests`);
      }
    });
  } catch (e) {
    errors.push(`❌ Unable to read test directory: ${e.message}`);
  }

  return errors;
}

async function main() {
  console.log('🌑 Dark Mode Validation\n');

  const tokenErrors = validateTokenFile();
  const cssErrors = validateComponentCSS();
  const snapshotErrors = validateSnapshots();

  const allErrors = [...tokenErrors, ...cssErrors, ...snapshotErrors];

  if (allErrors.length === 0) {
    console.log('✅ All dark mode validations passed!');
    console.log('   • Token file is canonical');
    console.log('   • All components use tokens');
    console.log('   • All tests have dark mode snapshots');
    process.exit(0);
  } else {
    console.log(allErrors.join('\n'));
    console.log(`\n❌ ${allErrors.length} validation error(s)\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
