# Review: Git Repository State

Reviewed: 2026-06-11T00:00:00Z
Reviewer: ijfw-review
Domain: software

## Summary

Critical data and configuration issues prevent proper repository state. Corrupted filenames from a failed extraction, tracked secrets in .env, and missing .gitignore at root create security and integrity risks. Fix file corruption first, then isolate secrets and workspace config.

## BLOCK findings (must-fix)

- **Corrupted filenames**: `Cdevcic-os*` directories and files exist on disk from mangled path extraction (colons converted). Delete these immediately—they corrupt git tracking. Run: `Remove-Item -Recurse -Force "C:\dev\Cdevcic-os*"`
- **.env tracked**: `.env` in git history contains secrets (GITHUB_TOKEN, DB_PASSWORD). Remove from index, commit removal, add to .gitignore, rotate tokens. Run: `git rm --cached .env && git commit -m "Remove .env secrets from tracking"`
- **No root .gitignore**: Workspace config (.claude/, .ijfw/, .github/) and build artifacts are untracked/unsuppressed. Create .gitignore with node_modules, .env, dist/, build/, .claude/, .ijfw/, and other standard ignores.

## FLAG findings (should-discuss)

- **Untracked source files**: 40+ TypeScript, config, and Docker files untracked (cic-cli.ts, Dockerfile.*, jest.config.js, etc.). Clarify: are these new code that should commit, or generated/temporary files that should ignore?
- **Remote mismatch**: Git remote is `cic-os.git` but root contains unrelated files (AGENTS.md, financeos/, charlie-deep-research/). Either these are submodules/workspace, or the repo structure needs clarification.
- **Nested .gitignore fragmentation**: 17 .gitignore files across subdirectories suggest each is a separate project. If intentional monorepo, consider a unified root .gitignore strategy.

## NIT findings (polish)

- **filemode=false + symlinks=false**: Git configured for Windows paths correctly, but symlinks disabled may cause issues if you move to Unix. Document this choice.

---

**Next step**: Delete corrupted `Cdevcic-os*` files, remove .env from git, create root .gitignore, then decide on untracked source files.
