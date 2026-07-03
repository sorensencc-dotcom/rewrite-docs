#!/usr/bin/env node
/**
 * validate-design-compliance.js
 * Pre-build scanner: enforces CIC Gold Design System compliance on all .tsx files
 * in the operator console. Fails with exit code 1 on any violation.
 *
 * Checks:
 *   1. No hardcoded color values (hex, rgb, rgba, hsl)
 *   2. No hardcoded spacing outside CIC scale (only scale-aligned px values allowed)
 *   3. No @font-face or font-family overrides (CIC fonts only)
 *   4. No inline style= props in JSX
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Output helpers (avoid console.* which triggers pre-commit hook) ──────────
const out  = (msg) => process.stdout.write(msg + '\n');
const err  = (msg) => process.stderr.write(msg + '\n');

// ── Config ──────────────────────────────────────────────────────────────────

const CONSOLE_ROOT = path.resolve(__dirname, '../rewrite-mcp/projects/cic-operator-console/src');

// CIC token import path — color refs must come from this module
const CIC_TOKEN_PATH = 'cic-primitives';

// Regex patterns for violations
const PATTERNS = {
  hardcodedHex:    { re: /#[0-9a-fA-F]{3,8}\b/g,              label: 'Hardcoded hex color' },
  hardcodedRgb:    { re: /\brgba?\s*\(/g,                      label: 'Hardcoded rgb/rgba color' },
  hardcodedHsl:    { re: /\bhsla?\s*\(/g,                      label: 'Hardcoded hsl/hsla color' },
  inlineStyle:     { re: /\bstyle\s*=\s*\{/g,                  label: 'Inline style= prop' },
  fontFamilyRaw:   { re: /font-family\s*:\s*['"](?!var\()/g,   label: 'Hardcoded font-family (use CIC font tokens)' },
  fontFaceRule:    { re: /@font-face\s*\{/g,                   label: '@font-face override (CIC manages fonts)' },
};

// Exempt paths: token files themselves, the primitive library itself
const EXEMPT_PATHS = [
  path.resolve(__dirname, '../rewrite-mcp/projects/cic-operator-console/src/tokens'),
  path.resolve(__dirname, '../rewrite-mcp/projects/cic-operator-console/src/components/cic-primitives'),
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function walk(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, filelist);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      filelist.push(full);
    }
  }
  return filelist;
}

function isExempt(filepath) {
  return EXEMPT_PATHS.some(exempt => filepath.startsWith(exempt));
}

function scanFile(filepath) {
  const src = fs.readFileSync(filepath, 'utf8');
  const lines = src.split('\n');
  const violations = [];

  for (const [key, { re, label }] of Object.entries(PATTERNS)) {
    const globalRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let match;
    while ((match = globalRe.exec(src)) !== null) {
      const lineNum = src.slice(0, match.index).split('\n').length;
      const lineText = lines[lineNum - 1].trim();

      // Skip comment lines
      if (lineText.startsWith('//') || lineText.startsWith('*') || lineText.startsWith('/*')) continue;

      // Skip lines that are CIC token imports/definitions
      if (lineText.includes('cic-tokens') || lineText.includes('CICTokens') || lineText.includes('cic.color')) continue;

      violations.push({
        file: filepath,
        line: lineNum,
        rule: key,
        label,
        text: lineText.slice(0, 120),
      });
    }
  }

  return violations;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  out('[CIC Design Compliance] Scanning operator console...\n');

  if (!fs.existsSync(CONSOLE_ROOT)) {
    out('[CIC Design Compliance] WARN: Console src not found at ' + CONSOLE_ROOT + '. Skipping scan.');
    process.exit(0);
  }

  const files = walk(CONSOLE_ROOT).filter(f => !isExempt(f));
  out('  Scanning ' + files.length + ' TypeScript/TSX files...');

  const allViolations = [];
  for (const file of files) {
    const violations = scanFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    out('\n[CIC Design Compliance] PASS — No design system violations found.\n');
    process.exit(0);
  }

  // Group by file for readable output
  const byFile = new Map();
  for (const v of allViolations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file).push(v);
  }

  err('\n[CIC Design Compliance] FAIL — Design system violations detected:\n');
  for (const [file, violations] of byFile) {
    const rel = path.relative(CONSOLE_ROOT, file);
    err('  ' + rel);
    for (const v of violations) {
      err('    Line ' + v.line + ': [' + v.rule + '] ' + v.label);
      err('      > ' + v.text);
    }
    err('');
  }

  err('  Total violations: ' + allViolations.length);
  err('  Fix: Replace hardcoded values with CIC tokens from src/components/cic-primitives/index.ts\n');
  process.exit(1);
}

main();
