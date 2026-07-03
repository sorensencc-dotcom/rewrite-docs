---
title: "ITEM 5 SKILL GENERATOR"
summary: "# ITEM 5: SKILL GENERATOR **Date:** 2026-07-02 **Purpose:** Vault + ENV_REFERENCE → runbook skills **Status:** Implementation-ready"
created: "2026-07-03T19:43:45.756Z"
updated: "2026-07-03T19:43:45.756Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# ITEM 5: SKILL GENERATOR
**Date:** 2026-07-02  
**Purpose:** Vault + ENV_REFERENCE → runbook skills  
**Status:** Implementation-ready

---

## OBJECTIVE

Auto-generate operator-grade skills from vault docs + environment reference. Transform stable architecture documentation into executable, tested, production-ready skills that Claude can use.

**Example:**
- **Input:** `cic-ref/CIC_ENV_REFERENCE.md` (all env vars, defaults, validation rules)
- **Output:** `skill-cic-env-validator.json` + `SKILL.md` + tests
- **Capability:** Validates environment before running pipeline

---

## SKILL GENERATION PIPELINE

```
Vault Doc (cic-ref/*.md)
    ↓
Extract:
  - Purpose (from H1 + frontmatter)
  - Inputs (from "Requires:" section)
  - Outputs (from "Produces:" section)
  - Logic (from "Steps:" or "Workflow:" section)
  - Examples (from "Usage:" section)
    ↓
Generate:
  - skill.json (metadata + triggers)
  - src/index.ts (implementation)
  - tests/skill.test.ts (test suite)
  - docs/USAGE.md (operator guide)
    ↓
Validate:
  - Triggers match use cases
  - Implementation matches spec
  - Tests pass
  - Documentation complete
    ↓
Deploy:
  - Skill ready in C:\dev\toolforge\skills\{name}/
  - Registered in SKILLPACK_MANIFEST.json
  - Available to Claude immediately
```

---

## SKILL TYPES (What We Can Generate)

### Type 1: Validator Skills
**Source:** Docs with validation rules (e.g., CIC_ENV_REFERENCE.md)

**Example: skill-cic-env-validator**
```json
{
  "name": "cic-env-validator",
  "type": "validator",
  "triggers": ["validate env", "check environment", "env check", "required vars"],
  "reads": ["cic-ref/CIC_ENV_REFERENCE.md"],
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

**Implementation reads:**
- All required vars from doc
- All default values
- All validation rules (type, range, format)
- Emits structured validation report

### Type 2: Runbook Skills
**Source:** Docs with step-by-step procedures (e.g., BUILD-SUMMARY.md deployment section)

**Example: skill-cic-deploy-checklist**
```json
{
  "name": "cic-deploy-checklist",
  "type": "runbook",
  "triggers": ["deploy cic", "go live", "production", "release"],
  "reads": ["cic-ref/BUILD-SUMMARY.md", "cic-ref/ROADMAP.md"],
  "outputs": {
    "type": "checklist",
    "format": "markdown_with_checkboxes"
  }
}
```

**Implementation:**
- Parses "Deployment:" section from docs
- Extracts checklist items
- Checks each condition
- Reports: ✅ Ready / ⚠️ Warning / ❌ Blocker

### Type 3: Query Skills
**Source:** Docs describing queries/lookups (e.g., CIC_TOKEN_PACK_v2_0_FULL_LIST.md)

**Example: skill-cic-token-lookup**
```json
{
  "name": "cic-token-lookup",
  "type": "query",
  "triggers": ["token pack", "what's the token", "model cost", "pricing"],
  "reads": ["cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST.md"],
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
- Parses token pack table from doc
- Indexes by model name
- Answers: "What does claude-opus cost?" → pulls from index

### Type 4: Integration Skills
**Source:** Docs describing integration points (e.g., AGENTS_API.md)

**Example: skill-cic-agent-registry**
```json
{
  "name": "cic-agent-registry",
  "type": "integration",
  "triggers": ["agent api", "list agents", "register agent", "agent schema"],
  "reads": ["cic-ref/AGENTS_API.md", "cic-ref/AGENTS.md"],
  "outputs": {
    "type": "schema_or_registry",
    "provides": "typed access to agents"
  }
}
```

**Implementation:**
- Exposes agent schema
- Validates agent configs
- Registers new agents
- Returns typed responses

---

## EXTRACTION ALGORITHM

### Phase 1: Scan Vault (10 min)

For each doc in cic-ref/:

```markdown
# Document Metadata (Frontmatter)
---
title: CIC Environment Reference
purpose: "Validate environment configuration"
inputs: ["System .env file"]
outputs: ["Validation report (JSON)"]
skill_type: "validator"
triggers: ["env check", "validate environment"]
---

# Body
## Requires
- ANTHROPIC_API_KEY (required, string)
- PORT (optional, number, default: 4000)
- QDRANT_URL (required, string, format: "http://host:port")

## Produces
- Validation report with:
  - status: valid | invalid
  - missing_vars: [...]
  - invalid_vars: [...]
  - recommendations: [...]

## Validation Rules
- ANTHROPIC_API_KEY must be non-empty
- PORT must be 1024-65535
- QDRANT_URL must be valid HTTP(S) URL
```

**Extract:**
- Purpose → skill description
- Inputs → skill inputs
- Outputs → skill output schema
- Validation Rules → validation logic
- Triggers → skill trigger phrases

### Phase 2: Generate Skill (15 min per skill)

**Template skill.json:**
```json
{
  "name": "skill-{type}-{name}",
  "version": "1.0.0",
  "description": "{extracted purpose}",
  "triggers": {extracted triggers},
  "reads": ["cic-ref/{source_doc}"],
  "type": "{validator|runbook|query|integration}",
  "inputs": {extracted inputs},
  "outputs": {extracted outputs},
  "implementation": {
    "language": "TypeScript",
    "entry": "src/index.ts",
    "tests": "tests/skill.test.ts"
  },
  "dependencies": ["@anthropic-ai/sdk", "zod"],
  "maturity": "alpha"
}
```

**Template src/index.ts:**
```typescript
import fs from 'fs';
import path from 'path';

interface SkillInput {
  {extracted input schema}
}

interface SkillOutput {
  {extracted output schema}
}

export async function run(input: SkillInput): Promise<SkillOutput> {
  // Read vault doc
  const docPath = path.resolve(process.cwd(), 'cic-ref/{source_doc}');
  const docContent = fs.readFileSync(docPath, 'utf-8');
  
  // Extract rules from doc
  const rules = extractRulesFromDoc(docContent);
  
  // Apply logic
  const result = applyLogic(input, rules);
  
  return result;
}

function extractRulesFromDoc(content: string): Rules {
  // Parse doc sections
  // Return structured rules
}

function applyLogic(input: SkillInput, rules: Rules): SkillOutput {
  // {Extracted validation/query/runbook logic}
}
```

**Template tests/skill.test.ts:**
```typescript
import { run } from '../src/index';

describe('skill-{name}', () => {
  it('should {extracted test case 1}', async () => {
    const input = {extracted input};
    const output = await run(input);
    expect(output.{field}).toEqual({expected});
  });
  
  it('should handle {extracted error case}', async () => {
    const input = {invalid input};
    expect(() => run(input)).toThrow();
  });
});
```

### Phase 3: Validate (10 min per skill)

- [ ] skill.json syntax valid (JSON schema)
- [ ] Triggers cover 3+ use cases from docs
- [ ] Implementation reads from correct doc
- [ ] Test suite passes (npm test)
- [ ] Output schema matches doc specification
- [ ] Documentation complete (USAGE.md)

### Phase 4: Register (5 min per skill)

Add to SKILLPACK_MANIFEST.json:
```json
{
  "skills": [
    {
      "name": "cic-env-validator",
      "version": "1.0.0",
      "type": "validator",
      "path": "toolforge/skills/cic-env-validator/",
      "status": "active",
      "registered": "2026-07-02"
    }
  ]
}
```

---

## GENERATED SKILLS (First Batch)

### Skill 1: cic-env-validator
**Source:** cic-ref/CIC_ENV_REFERENCE.md  
**Type:** Validator  
**Purpose:** Validate all required env vars before running pipeline  
**Triggers:** "env check", "validate environment", "check vars"

**Implementation:**
- Reads CIC_ENV_REFERENCE.md
- Extracts all required/optional vars + rules
- Checks current environment
- Returns validation report

**Test cases:**
- ✓ All required vars present and valid
- ✓ Missing ANTHROPIC_API_KEY → error
- ✓ PORT not a number → warning
- ✓ QDRANT_URL invalid URL → error

---

### Skill 2: cic-deploy-checklist
**Source:** cic-ref/BUILD-SUMMARY.md (Deployment section)  
**Type:** Runbook  
**Purpose:** Pre-deployment verification checklist  
**Triggers:** "deploy", "go live", "production check", "ready to ship"

**Implementation:**
- Reads BUILD-SUMMARY.md Deployment section
- Extracts checklist items
- Checks each (health endpoints, tests, logs, etc.)
- Returns: ✅ Go / ⚠️ Caution / ❌ Hold

**Test cases:**
- ✓ All checks pass → "Go"
- ✓ One check fails (missing health endpoint) → "Hold"
- ✓ Warning condition (old test results) → "Caution"

---

### Skill 3: cic-token-lookup
**Source:** cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST.md  
**Type:** Query  
**Purpose:** Look up token pricing and context windows  
**Triggers:** "token pack", "model cost", "context window", "pricing"

**Implementation:**
- Parses token pack table
- Indexes by model (claude-opus, claude-sonnet, etc.)
- Answers: "What's the input cost for claude-opus?"

**Test cases:**
- ✓ "claude-opus" → returns input/output costs + context window
- ✓ "claude-xyz" (unknown model) → "Model not found"
- ✓ Cached for 1 hour → fast lookup

---

### Skill 4: cic-observability-guide
**Source:** cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN.md  
**Type:** Runbook  
**Purpose:** Guide for setting up observability  
**Triggers:** "observability setup", "prometheus", "grafana", "metrics", "alerts"

**Implementation:**
- Reads observability plan
- Provides step-by-step setup instructions
- Validates: "Is Prometheus running?"
- Returns: Setup status + next steps

---

### Skill 5: cic-agent-schema
**Source:** cic-ref/AGENTS_API.md  
**Type:** Integration  
**Purpose:** Validate agent configurations against schema  
**Triggers:** "agent schema", "agent config", "validate agent"

**Implementation:**
- Parses AGENTS_API.md for schema definition
- Generates Zod schema from doc
- Validates incoming agent configs
- Returns: ✅ Valid / ❌ Invalid (with errors)

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Extraction (30 min)
- [ ] Read all 7 cic-ref docs
- [ ] Extract: purpose, inputs, outputs, rules, triggers
- [ ] Create extraction template (JSON)
- [ ] Verify extracted data matches doc

### Phase 2: Generation (60 min)
- [ ] Generate skill.json for each doc
- [ ] Generate src/index.ts (with stubs)
- [ ] Generate tests/skill.test.ts
- [ ] Generate docs/USAGE.md

### Phase 3: Implementation (90 min)
- [ ] Fill in implementation logic (skill by skill)
- [ ] Wire docs reading (fs.readFileSync)
- [ ] Implement parsing + validation
- [ ] Implement test cases

### Phase 4: Testing (60 min)
- [ ] npm test (all skills)
- [ ] Manual testing: "env check"
- [ ] Manual testing: "deploy checklist"
- [ ] Manual testing: "token lookup claude-opus"
- [ ] Manual testing: "observability setup"

### Phase 5: Registration (20 min)
- [ ] Update SKILLPACK_MANIFEST.json
- [ ] Verify skills loadable in Claude
- [ ] Test: skill is triggered by phrases
- [ ] Document in skill-registry.md

---

## DEPLOYMENT

**Skills directory structure:**
```
C:\dev\toolforge\skills\
├── cic-env-validator/
│   ├── skill.json
│   ├── package.json
│   ├── src/index.ts
│   ├── tests/skill.test.ts
│   ├── docs/USAGE.md
│   └── README.md
├── cic-deploy-checklist/
│   ├── skill.json
│   ├── src/index.ts
│   ├── tests/skill.test.ts
│   └── docs/USAGE.md
├── cic-token-lookup/
│   ├── skill.json
│   ├── src/index.ts
│   ├── tests/skill.test.ts
│   └── docs/USAGE.md
├── ... (3 more skills)
└── SKILLPACK_MANIFEST.json
```

**Install skills:**
```bash
cd C:\dev\toolforge\skills
npm install  # Install dependencies for all skills
npm test     # Run all tests
```

---

## SUCCESS CRITERIA

✅ 5 skills generated from vault docs  
✅ Each skill has: skill.json, src/index.ts, tests, USAGE.md  
✅ All tests pass (npm test)  
✅ Skills loadable in Claude  
✅ Triggers cover realistic use cases  
✅ Documentation complete and accurate  
✅ Each skill runs <1s  

---

## NEXT STEPS

1. **Approve skill list** — Is cic-env-validator the right start?
2. **Confirm trigger phrases** — Do they match operator vocabulary?
3. **Implement Phase 1** — Extract metadata from vault docs
4. **Implement Phase 2-3** — Generate + implement skills
5. **Test & register** — Validate before deploying

