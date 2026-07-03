#!/usr/bin/env node

/**
 * Phase Config Validator
 * Validates phase.yaml files against JSON schema
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');

const args = process.argv.slice(2);
const schemaIdx = args.indexOf('--schema');
const phasesIdx = args.indexOf('--phases');

const schemaPath = schemaIdx >= 0 ? args[schemaIdx + 1] : 'schemas/phase.schema.json';
const phasesPath = phasesIdx >= 0 ? args[phasesIdx + 1] : '../roadmap-runner/phases';

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv();
const validate = ajv.compile(schema);

function validatePhaseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let phaseData;

  try {
    phaseData = yaml.load(content);
  } catch (e) {
    console.error(`[ERROR] ${path.basename(filePath)} is invalid YAML: ${e.message}`);
    process.exit(1);
  }

  const valid = validate(phaseData);
  if (!valid) {
    console.error(`[ERROR] ${path.basename(filePath)} failed schema validation:`);
    console.error(validate.errors);
    process.exit(1);
  }

  console.log(`[OK] ${path.basename(filePath)}`);
}

// Validate all phase files
if (fs.existsSync(phasesPath)) {
  const files = fs.readdirSync(phasesPath).filter((f) => f.endsWith('.yaml'));
  for (const file of files) {
    validatePhaseFile(path.join(phasesPath, file));
  }
  console.log(`\n[validate-phases] All ${files.length} phase configs passed validation.`);
} else {
  console.error(`[ERROR] Phases path not found: ${phasesPath}`);
  process.exit(1);
}
