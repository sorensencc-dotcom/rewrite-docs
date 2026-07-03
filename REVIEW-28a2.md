# Review: Phase 28a.2 Manifest + CLI Implementation

Reviewed: 2026-06-11T16:30:00Z
Reviewer: ijfw-review
Domain: software

## Summary

Phase 28a.2 delivers core manifest schema + CLI for skill registration, with solid database design and service layer. However, missing input validation on user-provided values (skill-id, repo URLs, paths) creates injection/traversal risks. Test coverage lacks error paths. Recommend pre-ship fixes for validation + error handling before wiring into production Docker.

## BLOCK findings (must-fix)

- `skill-manifest.ts:60` GitHub URL validation uses substring check `includes("github.com")`. Accepts github.com.evil.com. Use URL parse + host validation.
- `skill-manifest.ts:69` localPath constructed via path.join without sanitization. skill-id like `../../../etc/passwd` traverses filesystem. Validate skill-id format (alphanumeric + dash/underscore only).
- `skill-manifest.ts:78` process.exit(1) on validation errors breaks graceful shutdown + container orchestration. Return error code via Promise rejection instead.
- `scp-governance-bridge.ts:34` No error handling in db.execute calls. Silent failures on constraint violations. Add try-catch + log details.
- `manifest-service.test.ts:15` Zero tests for error cases (DB failures, NULL returns, constraint violations). Add minimum: registerSkill duplicate key, getSkillById not found.

## FLAG findings (should-discuss)

- `skill-manifest.ts:53` No validation of skill-id format. Allows special chars that break CLI commands. Define allowed pattern: `^[a-z0-9\-_]+$`.
- `manifest-service.ts:21` registerSkill doesn't validate skill.localPath is within ~/.claude/skills/. External paths could corrupt user filesystem.
- `scp-governance-bridge.ts:49` calculateContributionRisk uses magic numbers (0.3, 0.2, 0.15) without justification. Document scoring rationale or externalize as config.
- `migrations/002_*.sql` & `003_*.sql` No DEFAULT values for is_available (defaults to NULL). Should be `DEFAULT true` or `NOT NULL`.
- `manifest-service.ts:108` listContributions doesn't bound result set. Large skill with 10K+ PRs OOMs. Add LIMIT or pagination.

## NIT findings (polish)

- `skill-manifest.ts:78, 81, 84` Inconsistent emoji usage (❌ vs ℹ️). Pick one style for errors, one for info.
- `scp-governance-bridge.ts` Missing JSDoc @throws documentation. recordContributionEvent / calculateContributionRisk should declare throw conditions.
- `manifest-service.ts:2` Import { Database } uses undefined type (no DB abstraction exported). Add stub type or import path.
- `skill-manifest.ts:52-55` Comment "MVP: we don't have real Git access" should explain what Phase 28a.3 will do (actual git fetch to get real commit SHA).

## Non-findings

✅ Database schema well-designed (indexes, foreign keys, timestamps)
✅ TypeScript types comprehensive (SkillManifestEntry, SkillContributionRecord)
✅ Migrations are idempotent (IF NOT EXISTS)
✅ Service layer separation of concerns (ManifestService, SCPGovernanceBridge)
✅ Docker integration (scp-init.sh, entrypoint wiring) correctly structured

