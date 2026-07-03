#!/usr/bin/env node

/**
 * Roadmap Schema Validator
 * Validates roadmap markdown files against JSON schema
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const args = process.argv.slice(2);
const schemaIdx = args.indexOf('--schema');
const docsIdx = args.indexOf('--docs');

const schemaPath = schemaIdx >= 0 ? args[schemaIdx + 1] : 'schemas/roadmap.schema.json';
const docsPath = docsIdx >= 0 ? args[docsIdx + 1] : 'out/docs/roadmap';

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv();
const validate = ajv.compile(schema);

function normalizeId(id) {
  let clean = id.toUpperCase().trim();
  clean = clean.replace(/[–—]/g, '-').replace(/\s+/g, '-');
  
  if (!clean.startsWith('PHASE-') && !clean.startsWith('RL-')) {
    if (clean.startsWith('PHASE')) {
      clean = clean.replace('PHASE', 'PHASE-');
    } else if (clean.startsWith('RL')) {
      clean = clean.replace('RL', 'RL-');
    } else {
      clean = 'PHASE-' + clean;
    }
  }
  
  const prefix = clean.startsWith('RL-') ? 'RL-' : 'PHASE-';
  let rest = clean.substring(prefix.length);
  rest = rest.replace(/[^A-Z0-9.]/g, '.');
  rest = rest.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, '');
  
  return prefix + rest;
}

function normalizeStatus(status) {
  const s = status.toLowerCase().trim();
  if (s.includes('progress') || s.includes('ongoing')) return 'in-progress';
  if (s.includes('pending') || s.includes('planned') || s.includes('queued') || s.includes('open')) return 'pending';
  if (s.includes('complete') || s === '✅' || s === 'success') return 'completed';
  if (s.includes('block')) return 'blocked';
  if (s.includes('deprecat')) return 'deprecated';
  return 'pending';
}

// Extract structured data from markdown (simplified)
function extractPhaseData(content) {
  const phases = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('| Phase |') || line.includes('|---|') || line.includes('| Status |')) {
      continue; // Header or separator
    }
    if (line.includes('|') && !line.includes('---')) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 4 && parts[1] && parts[3]) {
        if (parts[1].toLowerCase() === 'phase' || parts[1] === '') {
          continue;
        }
        phases.push({
          id: normalizeId(parts[1]),
          title: parts[2] || 'Untitled Phase',
          status: normalizeStatus(parts[3]),
        });
      }
    }
  }

  return { phases };
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = extractPhaseData(content);

  const valid = validate(data);
  if (!valid) {
    console.error(`[ERROR] ${path.basename(filePath)} failed schema validation:`);
    console.error(validate.errors);
    process.exit(1);
  }

  console.log(`[OK] ${path.basename(filePath)}`);
}

// Validate all markdown files
if (fs.existsSync(docsPath)) {
  const files = fs.readdirSync(docsPath).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    validateFile(path.join(docsPath, file));
  }
} else {
  console.error(`[ERROR] Docs path not found: ${docsPath}`);
  process.exit(1);
}

console.log('\n[validate-schema] All roadmap files passed schema validation.');
