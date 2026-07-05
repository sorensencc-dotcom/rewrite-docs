# CIC Runtime Roadmap

## Milestones

- [x] **v0.8.0** — Deploy → Heal → Optimize (shipped 2026-06-23). See `.planning/_archive/v0.8.0/SUMMARY.md`.

---

### v0.9.0 — Adaptive Memory + Semantic Caching
**Status:** [ ] Next (2026-06-24)

Make CIC economically intelligent about memory. Reuse past reasoning when safe, cache semantic work products, avoid recomputation under stable drift, auto-invalidate memory when cost or SLA pressure rises.

- [ ] Phase 9: Adaptive Memory + Semantic Caching (10 files, 3 days)
  - Semantic cache engine (embedding-based keys, multi-tier cache)
  - Memory reuse evaluator (drift-aware, cost-aware)
  - Memory delta tracker (world-state changes)
  - Adaptive retrieval router (full/partial/no reuse)
  - Cache write policy engine
  - CIC integration adapter
  - 7 Prometheus memory metrics
  - 5 audit event types

**Estimated:** 20% — 40% cost reduction across planning + analysis agents.

---

## Infrastructure & Compliance

### Operator Image Build Verification (PHASE-26)

**Status:** ⏳ VERIFICATION PENDING (scheduled run 2026-07-05 02:00 UTC)

Autonomous deterministic Docker build system (harness-v3, onnx-sidecar) deployed. First scheduled run tomorrow. Critical path items before trusting production:

- [ ] **Monitor first scheduled run (2026-07-05 after 02:00 UTC)**
  - Check log: `C:\dev\tasks\operator-image-build-*.log`
  - Verify task actually executed (file exists and has timestamps)
  - Review for success or failure status + error messages

- [ ] **Verify Docker/npm accessible in Task Scheduler context**
  - Manually test: `docker --version` in scheduled task context
  - Verify npm can install packages (check lock file, registry access)
  - Test containerd for import action (if used)

- [ ] **Verify registry.internal:5000 reachable from Task Scheduler user**
  - `curl -s registry.internal:5000/v2/_catalog` must work
  - If VPN or auth required, ensure credentials available to unattended context
  - Test push/pull permissions (not just connectivity)

- [ ] **Verify Slack webhook configured**
  - Confirm `$env:SLACK_WEBHOOK` set in Task Scheduler environment
  - Manual test: `Invoke-RestMethod` with test payload
  - Verify notifications actually send (or adjust silent failure handling)

- [ ] **Investigate submodule state changes**
  - Check dirty: `castironforge/cic-ingestion` and `toolforge`
  - Determine if real work or artifact artifacts
  - Commit or discard before production deploy

- [ ] **Build actual Docker images for end-to-end test**
  - Create harness-v3 and onnx-sidecar images with correct Dockerfiles
  - Test full pipeline: build → tag → push → verify → import
  - Verify SOURCE_DATE_EPOCH reproducibility (layer hashes match)

**Docs:**

- C:\dev\docs\operations\autonomous-image-builds.md — Scheduling reference
- C:\dev\docs\operations\environment-optimization.md — Filesystem troubleshooting
- C:\dev\toolforge\skills\operator-image-build\docs\USAGE.md — CLI reference

**Risk:** Highest risk is registry unreachable or docker/npm missing in unattended context. Task will retry 3x over 15min, then fail silently unless logs checked.

---

### NVIDIA API Deprecation (Sep 30, 2026 Deadline)

**Status:** ✅ COMPLIANT — Audit complete, validation tests ready, monitoring in place

- [x] Audit CIC codebase for team-scoped paths (zero found)
- [x] Verify docker-compose uses global endpoint (integrate.api.nvidia.com/v1)
- [x] Create NVIDIA-COMPLIANCE.md audit report
- [x] Build staging validation test suite (tests/nvidia-api-compliance.test.ts)
- [x] Deploy monitoring script (scripts/monitor-nvidia-api-errors.ts)
- [ ] Run staging validation (recommended early September)
- [ ] Production monitoring active (after Sep 30)

**Files:**

- C:\CIC_MEDIA_LIBRARY\NVIDIA-COMPLIANCE.md — Audit + baseline config
- C:\CIC_MEDIA_LIBRARY\NVIDIA-COMPLIANCE-SETUP.md — Operations runbook
- C:\CIC_MEDIA_LIBRARY\CIC\tests\nvidia-api-compliance.test.ts — Test suite
- C:\CIC_MEDIA_LIBRARY\CIC\scripts\monitor-nvidia-api-errors.ts — Monitoring tool

**Deadline:** September 30, 2026 (zero action required; infrastructure already compliant)

---

## Next Steps

Run `/ijfw-workflow` to plan Phase 9, or use `/ijfw-complete-milestone v0.8.0` to archive v0.8.0 and seed v0.9.0.

For NVIDIA compliance: run staging validation test suite before Sep 30 (see NVIDIA-COMPLIANCE-SETUP.md).

---

## Archive

Shipped milestones: `.planning/_archive/`
