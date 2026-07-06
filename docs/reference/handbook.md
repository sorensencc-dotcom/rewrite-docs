---
name: developer-handbook
description: Developer handbook — coding standards, workflows, patterns for CIC
metadata:
  type: reference
---

# Developer Handbook

Coding standards, patterns, and workflows for CIC development.

## Quick Links
- **[Coding Standards](#coding-standards)**
- **[Git Workflows](#git-workflows)**
- **[Testing Patterns](#testing-patterns)**
- **[Documentation Standards](#documentation-standards)**

---

## Coding Standards

### TypeScript/Node.js

**File Organization:**
- Use absolute imports with `@` alias (e.g., `@cic/services/memory`)
- Keep files under 500 lines (split large files)
- Export types and implementations separately

**Type Safety:**
- No `any` types (use `unknown` + type guards)
- Strict tsconfig: `strict: true`, `noImplicitAny: true`
- Fully typed function signatures (no bare parameters)

**Naming:**
- Classes: `PascalCase` (e.g., `MemoryService`)
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Private members: `_leadingUnderscore`

### Docker

**Determinism:**
- Pin base image versions (no `latest`)
- Use multi-stage builds
- Reproducible layer hashes (sorted RUN commands)

**Security:**
- No secrets in images (use env vars)
- Run as non-root user
- Minimal base images (alpine/distroless where possible)

---

## Git Workflows

### Commits

**Format:**
```
type(scope): description

Long explanation (optional).

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**Types:**
- `feat:` new feature
- `fix:` bug fix
- `chore:` maintenance (docs, deps, etc.)
- `refactor:` code reorganization (no behavior change)
- `test:` test additions/fixes

**Scopes:**
- `cic:` core CIC functionality
- `rewrite-labs:` Rewrite Labs features
- `deployment:` Docker/K8s changes
- `docs:` documentation
- `ci:` CI/CD pipeline

### Branching

- `main`: production-ready code
- Feature branches: descriptive names (`feature/phase-26-torquequery`)
- Never rewrite public history (use `git revert` instead of `--force`)

### PRs

- Atomic commits (each commit builds and passes tests)
- Link to relevant tickets/issues
- Request review from code owners
- Squash merge to main (keep history clean)

---

## Testing Patterns

### Jest Configuration

**Setup:**
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@cic/(.*)$': '<rootDir>/cic/$1',
  },
  testTimeout: 30000,
};
```

**Async Tests:**
```typescript
test('async operation', async () => {
  const result = await someAsyncOp();
  expect(result).toBeDefined();
});
```

**Mocking:**
```typescript
jest.mock('@cic/services/memory');
const mockMemory = Memory as jest.Mocked<typeof Memory>;
```

---

## Documentation Standards

### Markdown Files

**YAML Frontmatter (Required):**
```yaml
---
name: kebab-case-identifier
description: One-line description
metadata:
  type: cic | deployment | reference | roadmap | meta
---
```

**Structure:**
1. Title (single `#`)
2. Brief summary (1-2 sentences)
3. Table of contents (for long docs)
4. Content sections (multiple `##`)
5. Links to related docs

**Code Examples:**
```typescript
// Always include language tag
function example() {
  return 'typed code';
}
```

---

## Phase Documentation

### Phase Specs

All phases follow this structure:
- **Contract:** Input/output, assumptions, guarantees
- **Implementation:** Step-by-step instructions
- **Verification:** Test cases, gates, rollback procedures
- **Status:** Current state, blockers, timeline

### Adding a New Phase

1. Create `docs/cic/phases/phase-X.md` with YAML frontmatter
2. Link from `docs/cic/phases/index.md`
3. Add to mkdocs.yml nav (under CIC Documentation → Phases 31-50)
4. Link related phases (phase-X-1, phase-X+1)
5. Update roadmap (CIC_MASTER_ROADMAP.md)

---

## Common Patterns

### Service Definition

```typescript
// src/services/MyService.ts
export interface IMyService {
  init(): Promise<void>;
  query(input: Input): Promise<Output>;
}

export class MyService implements IMyService {
  async init(): Promise<void> {
    // Initialization logic
  }

  async query(input: Input): Promise<Output> {
    // Query logic
  }
}
```

### Error Handling

```typescript
// Use typed error objects
export class CICError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CICError';
  }
}

// Throw with context
throw new CICError('GOVERNANCE_001', 'Policy violation', {
  policy: 'data-retention',
  retention: 90,
});
```

### Logging

```typescript
import { observability } from '@cic/services/observability';

observability.log('info', 'Operation started', {
  phase: 26,
  operation: 'TorqueQuery.init',
  timestamp: Date.now(),
});
```

---

## Troubleshooting

### Common Issues

**TypeScript Compilation Errors:**
- Check tsconfig.json: `strict: true`
- Verify @cic aliases in moduleNameMapper
- Run `npm run build` to see full error list

**Jest Timeouts:**
- Increase `testTimeout` in jest.config.js
- Check for unresolved promises
- Mock external services (network calls)

**Docker Build Failures:**
- Check base image availability
- Verify all dependencies are pinned
- Use `docker build --progress=plain` for debug output

---

## Resources

- **[Architecture Overview](../architecture/overview.md)** — System design
- **[CIC Governance](../cic/governance.md)** — Compliance and audit
- **[Deployment Guide](../deployment/docker.md)** — Docker/K8s setup
- **[Reference Schemas](../reference/schemas.md)** — Type definitions

---

**Last Updated:** 2026-07-06  
**Version:** 1.0.0
