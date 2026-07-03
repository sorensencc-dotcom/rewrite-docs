---
title: "Repo Cleanup REVIEW"
summary: "# Review: repo-cleanup session work (backups, key checklist, fds removal, cleanup plan)"
created: "2026-07-03T19:43:45.902Z"
updated: "2026-07-03T19:43:45.902Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Review: repo-cleanup session work (backups, key checklist, fds removal, cleanup plan)

Reviewed: 2026-07-03T00:55:00-04:00
Reviewer: ijfw-review
Domain: software

## Summary

Execution so far is recoverable and correctly ordered, but the fds.fx.reporting backup is incomplete in exactly the way that matters: the bundle holds only `main`, while the other 4 branches exist solely on the personal GitHub repo that is queued for deletion. Fix that before anyone touches the GitHub repo. Secondary: the plan's severity labels have public/private inverted — rewrite-mcp (leaked keys) is PRIVATE, while rewrite-docs (dev repo, snapshots, full workspace history) is PUBLIC.

## BLOCK findings (must-fix)

- C:\dev-backups\2026-07-03\fds.fx.reporting.bundle: [BLOCK] Bundle contains only `main`; branches backup/column-visibility-stable, fix/top-currency-pairs-show-pair, release/fx-blotter-factset, trade-details-analysis exist ONLY on github.com/sorensencc-dotcom/fds.fx.reporting (local clone never fetched them). Deleting the GitHub repo now = 4 branches gone. Fix: `git clone --mirror` from GitHub → re-bundle before any deletion, in addition to the user confirming the work-account copy.
- Phase 0/plan: [BLOCK] Bundles capture commits only — the 51+47+52 dirty working-tree files across toolforge/rewrite-mcp/claude-skills have no backup until Phase 2 commits them. Any destructive step before Phase 2 completes risks unrecoverable loss. Fix: complete Phase 2 commits before Phase 3 filter-repo (plan already orders this — enforce it strictly).

## FLAG findings (should-discuss)

- Plan/checklist "public exposure" claim: [FLAG] rewrite-mcp is PRIVATE (verified via gh); key leak is private-surface, not public-scraper exposure. Rotation still correct (keys visible to anyone with repo access; history rewrite pending) but urgency wording is wrong. Fix: correct KEY-ROTATION-CHECKLIST.md wording.
- rewrite-docs (dev repo) is PUBLIC: [FLAG] Full C:\dev workspace history incl. 42 MB snapshot tarballs is publicly visible. Tarball spot-check found no live keys (.env.headroom empty, secrets.md clean) but only patterns were checked, not full contents. Fix: consider making rewrite-docs private; purge snapshots/ from history (not just index) in Phase 4.
- C:\dev-backups on same physical disk as C:\dev: [FLAG] Disk failure during history rewrite loses originals and backups together. Fix: copy 2026-07-03/ to external/cloud storage before Phase 3 force-push.
- fds gitlink commit message "relocated to work account": [FLAG] Unverified claim — user has not yet confirmed the work copy has all 5 branches. Fix: hold GitHub deletion until confirmed (already gated).
- fds.fx.reporting.bundle (26 MB employer code) retained in personal backup dir: [FLAG] Conflicts with "remove from environment" goal. Fix: delete bundle after work-copy confirmation.

## NIT findings (polish)

- Plan Verification section: [NIT] `git bundle verify` must run from within the source repo — running it from the backup dir produces false FAILs. Fix: note cwd requirement.
- C:\dev\repo-cleanup-REVIEW.md placement: [NIT] Root-md policy conflict with skill artifact contract; move to docs/meta/ during Phase 6.
