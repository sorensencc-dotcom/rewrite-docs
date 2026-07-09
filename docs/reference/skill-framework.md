---
title: "Skill Framework & Development Guide"
description: "Unified framework for skill definition, generation, and deployment"
created: "2026-07-07"
tags:
  - skills
  - framework
  - architecture
  - development
canonical: true
backlinks:
  - docs/item-5-skill-generator.md (Generation pipeline)
  - docs/item-6-knowledge-graph.md (Skill nodes in graph)
  - docs/reference/pipeline-architecture.md (Phase 3-5: Generation, Validation, Deployment)
---

# Skill Framework & Development Guide

Complete framework for defining, generating, and deploying Claude skills powered by vault documentation.

---

## SKILL DEFINITION

### What is a Skill?

A **skill** is an executable capability that Claude can invoke, built from stable vault documentation and implementing a specific use case.

**Characteristics:**
- **Sourced from vault:** Built on cic-ref/ documentation (source of truth)
- **Executable:** Implemented in TypeScript, tested, deployable
- **Specific:** Solves a concrete operator problem
- **Documented:** Includes usage guide + examples
- **Versioned:** Tracked in SKILLPACK_MANIFEST.json

**Example:** `cic-env-validator` skill
- **Source:** cic-ref/CIC_ENV_REFERENCE.md
- **Purpose:** Validate all required environment variables
- **Trigger:** "env check", "validate environment"
- **Output:** Validation report (missing/invalid vars + recommendations)

---

## SKILL TYPES

### Type 1: Validator Skills

**Purpose:** Validate system state against documented rules

**Source:** Docs with validation rules (e.g., CIC_ENV_REFERENCE.md, deployment checklists)

**Pattern:**
```json
{
  "name": "cic-env-validator",
  "type": "validator",
  "triggers": ["validate env", "check environment", "env check", "required vars"],
  "inputs": {
    "type": "object",
    "properties": {
      "env_vars": { "type": "object", "description": "process.env snapshot" }
    }
  },
  "outputs": {
    "type": "validation_report",
    "schema": {
      "status": "valid | invalid",
      "missing_vars": ["ANTHROPIC_API_KEY", "..."],
      "invalid_vars": [{"var": "PORT", "reason": "not a number"}],
      "recommendations": ["Set ANTHROPIC_API_KEY", "..."]
    }
  }
}
```

**Implementation:**
- Reads vault doc (e.g., CIC_ENV_REFERENCE.md)
- Extracts validation rules
- Checks current environment
- Returns structured validation report

**Test Cases:**
- ✓ All required vars present and valid → status: "valid"
- ✓ Missing ANTHROPIC_API_KEY → error in missing_vars
- ✓ PORT not a number → warning in invalid_vars
- ✓ QDRANT_URL invalid URL → error with reason

**Example Trigger:** `cic-env-validator --env`

---

### Type 2: Runbook Skills

**Purpose:** Execute documented procedures step-by-step

**Source:** Docs with checklist or step-by-step procedures (e.g., deployment checklist, setup guide)

**Pattern:**
```json
{
  "name": "cic-deploy-checklist",
  "type": "runbook",
  "triggers": ["deploy", "go live", "production check", "ready to ship"],
  "inputs": {
    "type": "object",
    "properties": {
      "check_all": { "type": "boolean", "default": true }
    }
  },
  "outputs": {
    "type": "checklist",
    "format": "markdown_with_checkboxes",
    "schema": {
      "status": "GO | CAUTION | HOLD",
      "items": [
        {
          "name": "Health endpoints",
          "status": "PASS | WARN | FAIL",
          "details": "..."
        }
      ],
      "blockers": ["..."],
      "warnings": ["..."]
    }
  }
}
```

**Implementation:**
- Parses "Deployment:" or "Checklist:" section from vault doc
- Extracts checklist items
- Checks each condition (health endpoint responding, tests passing, logs clean)
- Returns: ✅ Go / ⚠️ Caution / ❌ Hold

**Test Cases:**
- ✓ All checks pass → status: "GO"
- ✓ One check fails (missing health endpoint) → status: "HOLD"
- ✓ Warning condition (old test results) → status: "CAUTION"

**Example Trigger:** `cic-deploy-checklist`

---

### Type 3: Query Skills

**Purpose:** Look up information from documented reference data

**Source:** Docs describing queries/lookups (e.g., token pack tables, agent registry, pricing)

**Pattern:**
```json
{
  "name": "cic-token-lookup",
  "type": "query",
  "triggers": ["token pack", "what's the token", "model cost", "pricing"],
  "inputs": {
    "type": "object",
    "properties": {
      "model": { "type": "string", "description": "Model name (e.g., claude-opus)" }
    }
  },
  "outputs": {
    "type": "table",
    "schema": {
      "model": "string",
      "input_tokens_per_1k": "number",
      "output_tokens_per_1k": "number",
      "context_window": "number"
    }
  }
}
```

**Implementation:**
- Parses token pack table from vault doc
- Indexes by model name
- Answers queries: "What does claude-opus cost?"
- Returns: pricing + context window

**Test Cases:**
- ✓ "claude-opus" → returns pricing + context window
- ✓ "claude-xyz" (unknown model) → "Model not found"
- ✓ Cached for 1 hour → fast lookup (<10ms)

**Example Trigger:** `cic-token-lookup claude-opus`

---

### Type 4: Integration Skills

**Purpose:** Expose documented APIs/schemas for validation or interaction

**Source:** Docs describing integration points (e.g., AGENTS_API.md, codeflow-api-contract.json)

**Pattern:**
```json
{
  "name": "cic-agent-schema",
  "type": "integration",
  "triggers": ["agent schema", "agent config", "validate agent"],
  "inputs": {
    "type": "object",
    "properties": {
      "agent_config": { "type": "object", "description": "Agent configuration to validate" }
    }
  },
  "outputs": {
    "type": "validation_result",
    "schema": {
      "valid": "boolean",
      "errors": ["..."],
      "schema": "full_schema_definition"
    }
  }
}
```

**Implementation:**
- Parses API/schema definition from vault doc
- Generates Zod schema from doc
- Validates incoming configs
- Returns: ✅ Valid / ❌ Invalid (with errors)

**Test Cases:**
- ✓ Valid agent config → valid: true
- ✓ Missing required field → valid: false, errors: ["missing field X"]
- ✓ Type mismatch → valid: false, errors: ["field X must be number"]

---

## SKILL METADATA (skill.json)

### Complete Example

```json
{
  "name": "cic-env-validator",
  "version": "1.0.0",
  "description": "Validate all required environment variables before running CIC pipeline",
  "author": "Platform Team",
  "license": "MIT",
  
  "type": "validator",
  "category": "configuration",
  "maturity": "alpha",
  
  "triggers": [
    "validate env",
    "check environment",
    "env check",
    "required vars"
  ],
  
  "reads": [
    "cic-ref/CIC_ENV_REFERENCE.md"
  ],
  
  "inputs": {
    "type": "object",
    "properties": {
      "env_vars": {
        "type": "object",
        "description": "Environment variables to validate (default: process.env)"
      }
    },
    "required": []
  },
  
  "outputs": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["valid", "invalid"],
        "description": "Overall validation status"
      },
      "missing_vars": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Required variables not set"
      },
      "invalid_vars": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "var": { "type": "string" },
            "reason": { "type": "string" }
          }
        },
        "description": "Variables that don't meet validation rules"
      },
      "recommendations": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Steps to fix validation errors"
      }
    },
    "required": ["status"]
  },
  
  "implementation": {
    "language": "TypeScript",
    "entry": "src/index.ts",
    "tests": "tests/skill.test.ts",
    "runtime": "node"
  },
  
  "dependencies": {
    "@anthropic-ai/sdk": "^1.0.0",
    "zod": "^3.22.0",
    "typescript": "^5.2.0"
  },
  
  "devDependencies": {
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.5"
  },
  
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/",
    "validate": "node src/index.ts"
  },
  
  "requirements": {
    "min_api_level": "1.0.0",
    "required_files": ["cic-ref/CIC_ENV_REFERENCE.md"],
    "system_requirements": "Node.js 18+"
  },
  
  "examples": [
    {
      "description": "Validate environment before deployment",
      "trigger": "validate env",
      "input": {},
      "expected_output": {
        "status": "valid",
        "missing_vars": [],
        "recommendations": []
      }
    }
  ],
  
  "tags": [
    "cic",
    "configuration",
    "validation",
    "deployment"
  ],
  
  "repository": {
    "type": "git",
    "url": "https://github.com/anthropic/cic-tools",
    "directory": "toolforge/skills/cic-env-validator"
  }
}
```

### Key Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✓ | Kebab-case identifier (e.g., cic-env-validator) |
| `version` | ✓ | Semver (e.g., 1.0.0) |
| `description` | ✓ | One-line purpose |
| `type` | ✓ | validator\|runbook\|query\|integration |
| `triggers` | ✓ | List of phrases to invoke skill |
| `reads` | ✓ | List of vault docs this skill depends on |
| `inputs` | ✓ | JSON Schema for input validation |
| `outputs` | ✓ | JSON Schema for output format |
| `implementation` | ✓ | Language, entry point, tests |
| `maturity` | ✓ | alpha\|beta\|stable |

---

## SKILL STRUCTURE (Filesystem)

**Required Layout:**

```
C:\dev\toolforge\skills\{skill-name}/
├── skill.json                    # Metadata + configuration
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── src/
│   └── index.ts                  # Main implementation
├── tests/
│   └── skill.test.ts             # Test suite (Jest)
├── docs/
│   └── USAGE.md                  # Operator guide with examples
├── README.md                     # Quick overview
└── .gitignore                    # Git ignore file
```

### File Templates

**src/index.ts:**
```typescript
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Input/output schemas
const InputSchema = z.object({
  env_vars: z.record(z.string()).optional()
});

const OutputSchema = z.object({
  status: z.enum(['valid', 'invalid']),
  missing_vars: z.array(z.string()),
  invalid_vars: z.array(z.object({
    var: z.string(),
    reason: z.string()
  })),
  recommendations: z.array(z.string())
});

export type SkillInput = z.infer<typeof InputSchema>;
export type SkillOutput = z.infer<typeof OutputSchema>;

export async function run(input: SkillInput): Promise<SkillOutput> {
  const envVars = input.env_vars || process.env;
  const docPath = path.resolve(process.cwd(), 'cic-ref/CIC_ENV_REFERENCE.md');
  const docContent = fs.readFileSync(docPath, 'utf-8');
  
  const rules = extractRulesFromDoc(docContent);
  const result = validateEnvironment(envVars, rules);
  
  return result;
}

function extractRulesFromDoc(content: string) {
  // Parse "Requires:" section
  // Return { [varName]: { type, required, validation, default } }
}

function validateEnvironment(env: Record<string, string>, rules: any): SkillOutput {
  const missing: string[] = [];
  const invalid: Array<{var: string; reason: string}> = [];
  const recommendations: string[] = [];
  
  for (const [varName, rule] of Object.entries(rules)) {
    if (rule.required && !env[varName]) {
      missing.push(varName);
      recommendations.push(`Set ${varName}=${rule.example || 'value'}`);
    } else if (env[varName] && rule.validation) {
      if (!rule.validation(env[varName])) {
        invalid.push({ var: varName, reason: rule.reason });
        recommendations.push(`Fix ${varName}: ${rule.reason}`);
      }
    }
  }
  
  return {
    status: missing.length === 0 && invalid.length === 0 ? 'valid' : 'invalid',
    missing_vars: missing,
    invalid_vars: invalid,
    recommendations
  };
}
```

**tests/skill.test.ts:**
```typescript
import { run, SkillInput, SkillOutput } from '../src/index';

describe('cic-env-validator', () => {
  it('should validate when all required vars present', async () => {
    const input: SkillInput = {
      env_vars: {
        ANTHROPIC_API_KEY: 'sk-test123',
        QDRANT_URL: 'http://localhost:6333',
        POSTGRES_URL: 'postgres://localhost/cic',
        PORT: '4000'
      }
    };
    const output = await run(input);
    expect(output.status).toBe('valid');
    expect(output.missing_vars).toHaveLength(0);
  });

  it('should error when required var missing', async () => {
    const input: SkillInput = {
      env_vars: {
        QDRANT_URL: 'http://localhost:6333'
      }
    };
    const output = await run(input);
    expect(output.status).toBe('invalid');
    expect(output.missing_vars).toContain('ANTHROPIC_API_KEY');
  });

  it('should warn when PORT out of range', async () => {
    const input: SkillInput = {
      env_vars: {
        ANTHROPIC_API_KEY: 'sk-test123',
        QDRANT_URL: 'http://localhost:6333',
        PORT: '999'
      }
    };
    const output = await run(input);
    expect(output.status).toBe('invalid');
    expect(output.invalid_vars.some(v => v.var === 'PORT')).toBe(true);
  });
});
```

**docs/USAGE.md:**
```markdown
# CIC Env Validator Usage Guide

## What It Does
Validates that all required environment variables are set and meet validation rules.

## Basic Usage

```bash
cic-env-validator
```

Returns:
```json
{
  "status": "valid",
  "missing_vars": [],
  "invalid_vars": [],
  "recommendations": []
}
```

## With Claude

```
User: validate env
Claude: I'll check your environment configuration...
```

## Examples

### Example 1: Valid Environment
All required vars set and correct format.
```bash
ANTHROPIC_API_KEY=sk-... QDRANT_URL=http://localhost:6333 PORT=4000 cic-env-validator
```

Output:
```json
{"status": "valid", "missing_vars": [], "invalid_vars": [], "recommendations": []}
```

### Example 2: Missing ANTHROPIC_API_KEY
```json
{
  "status": "invalid",
  "missing_vars": ["ANTHROPIC_API_KEY"],
  "invalid_vars": [],
  "recommendations": ["Set ANTHROPIC_API_KEY=sk-..."]
}
```

## Troubleshooting

Q: How do I set environment variables?
A: Create a `.env` file or export in shell:
```bash
export ANTHROPIC_API_KEY=sk-...
export QDRANT_URL=http://localhost:6333
```

Q: What validation rules apply?
A: See [CIC_ENV_REFERENCE.md](../cic-ref/CIC_ENV_REFERENCE.md) for complete rules.
```
```

---

## SKILL GENERATION PIPELINE

### Phase 1: Extraction (Vault → Manifest)

**Input:** cic-ref/*.md files  
**Output:** extraction_manifest.json

For each doc:
1. Parse frontmatter (title, purpose, inputs, outputs)
2. Extract sections:
   - "Requires:" → validation rules
   - "Produces:" → output schema
   - "Steps:" → runbook logic
   - "Triggers:" → skill invocation phrases
3. Build structured extraction record

### Phase 2: Generation (Manifest → Code)

**Input:** extraction_manifest.json  
**Output:** Skill directories with code + tests

For each extracted doc:
1. Generate skill.json (from frontmatter + extraction)
2. Generate src/index.ts (with stubs)
3. Generate tests/skill.test.ts (test cases)
4. Generate docs/USAGE.md (operator guide)

### Phase 3: Validation (Code → Tested Artifacts)

**Input:** Generated skills  
**Output:** Validated, tested skills

For each skill:
1. npm test (run Jest suite)
2. TypeScript type-check (tsc --noEmit)
3. Documentation review (USAGE.md complete)
4. Schema validation (outputs match declared type)

**Validation gates (must all pass):**
- ✅ All tests pass (100% pass rate)
- ✅ TypeScript compilation succeeds
- ✅ Documentation complete
- ✅ Triggers cover 3+ realistic use cases

### Phase 4: Deployment (Tested → Registered)

**Input:** Validated skills  
**Output:** Deployed skills in toolforge/

1. Update SKILLPACK_MANIFEST.json
2. Copy skill directories to final location
3. Verify skills load (Claude skill registry check)
4. Document in skill-registry.md

---

## FIRST BATCH SKILLS

### Skill 1: cic-env-validator
- **Source:** cic-ref/CIC_ENV_REFERENCE.md
- **Type:** Validator
- **Triggers:** "env check", "validate environment"
- **Implemented:** Yes

### Skill 2: cic-deploy-checklist
- **Source:** cic-ref/BUILD-SUMMARY.md (Deployment section)
- **Type:** Runbook
- **Triggers:** "deploy", "go live", "production check"
- **Status:** Stub generated

### Skill 3: cic-token-lookup
- **Source:** cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST.md
- **Type:** Query
- **Triggers:** "token pack", "model cost", "pricing"
- **Status:** Stub generated

### Skill 4: cic-observability-guide
- **Source:** cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN.md
- **Type:** Runbook
- **Triggers:** "observability setup", "prometheus", "metrics"
- **Status:** Stub generated

### Skill 5: cic-agent-schema
- **Source:** cic-ref/AGENTS_API.md
- **Type:** Integration
- **Triggers:** "agent schema", "agent config", "validate agent"
- **Status:** Stub generated

---

## SKILL REGISTRY

**Location:** C:\dev\toolforge\skills\SKILLPACK_MANIFEST.json

```json
{
  "name": "CIC Skill Pack",
  "version": "1.0.0",
  "skills": [
    {
      "name": "cic-env-validator",
      "version": "1.0.0",
      "type": "validator",
      "path": "toolforge/skills/cic-env-validator/",
      "status": "active",
      "registered": "2026-07-02",
      "maturity": "alpha"
    },
    {
      "name": "cic-deploy-checklist",
      "version": "1.0.0",
      "type": "runbook",
      "path": "toolforge/skills/cic-deploy-checklist/",
      "status": "active",
      "registered": "2026-07-02",
      "maturity": "alpha"
    }
  ]
}
```

---

## SUCCESS CRITERIA

✅ 5 skills generated from vault docs  
✅ Each skill has: skill.json, src/index.ts, tests, USAGE.md, docs/  
✅ All tests pass (npm test)  
✅ Skills loadable in Claude  
✅ Triggers cover realistic operator use cases  
✅ Documentation complete and accurate  
✅ Each skill runs <1s  

---

## TROUBLESHOOTING

### Skill Not Loading
1. Check skill.json syntax (JSON validation)
2. Verify path in SKILLPACK_MANIFEST.json
3. Check file permissions (readable by Claude)
4. Review logs: `npm run lint`

### Tests Failing
1. Verify test data matches skill.json schema
2. Check vault doc (is source doc correct?)
3. Run individual test: `npm test -- skill.test.ts`
4. Debug: `node --inspect src/index.ts`

### Output Schema Mismatch
1. Compare skill.json outputs with actual return value
2. Ensure all required fields present
3. Check type conversions (number vs string)
4. Validate with Zod: `OutputSchema.parse(result)`

---

## CROSS-REFERENCES

- **Generation Pipeline:** See `docs/reference/pipeline-architecture.md`
- **Configuration Patterns:** See `docs/reference/configuration-logging.md`
- **Knowledge Graph:** See `docs/item-6-knowledge-graph.md`
- **Full Spec:** See `docs/item-5-skill-generator.md`

---

**Last Updated:** 2026-07-07  
**Extracted From:** Item 5 Skill Generator + Index Unified (60-70% duplication reduction)  
**Maintainer:** Platform Engineering
