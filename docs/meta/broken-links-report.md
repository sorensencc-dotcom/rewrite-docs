# Knowledge Base Broken Links Analysis

**Total Broken Links:** 357
**Last Sync:** 2026-07-08T00:10:21.272824
**Status:** ISSUES_FOUND

## Executive Summary

| Strategy | Count | Est. Links Fixed | Priority |
|----------|-------|------------------|----------|
| Phase Docs | 36 | ~35 | 🔴 High |
| Sandbox Docs | 56 | ~26 | 🟡 Medium |
| Relative Paths | 53 | ~20 | 🟡 Medium |
| Vault Refs | 17 | ~46 | 🔴 High |
| Missing Overview | 5 | ~12 | 🟢 Low |
| Other | 190 | ~10 | 🟢 Low |

---

## Strategy 1: Missing Phase Documentation (35+ links)

**Issue:** References to phase architecture, training, and overview docs that don't exist.

**Files to Create:**

- [ ] `phase-2-architecture.md` — referenced by 8 files
     - Example from: `cic/phases/phase-2-action-space.md`
- [ ] `phase-2-training-loop.md` — referenced by 6 files
     - Example from: `cic/phases/phase-2-architecture.md`
- [ ] `./phase-27-wave-f-architecture.md` — referenced by 5 files
     - Example from: `cic/phase-27-wave-f-fixtures.md`
- [ ] `phase-1-overview.md` — referenced by 4 files
     - Example from: `cic/phases/index.md`
- [ ] `phase-2-overview.md` — referenced by 4 files
     - Example from: `cic/phases/index.md`
- [ ] `phase-1-architecture.md` — referenced by 4 files
     - Example from: `cic/phases/phase-1-bridge-orchestrator.md`
- [ ] `phases/phase-2-overview.md` — referenced by 1 files
     - Example from: `cic/index.md`
- [ ] `phases/phase-1-architecture.md` — referenced by 1 files
     - Example from: `cic/index.md`
- [ ] `phases/phase-1-overview.md` — referenced by 1 files
     - Example from: `cic/index.md`
- [ ] `phases/phase-2-architecture.md` — referenced by 1 files
     - Example from: `cic/index.md`
- [ ] `phases/phase-2-training-loop.md` — referenced by 1 files
     - Example from: `cic/index.md`

---

## Strategy 2: Sandbox Architecture & Runtime Docs (26+ links)

**Issue:** Sandbox-3 reference documentation missing.

**Files to Create:**

- [ ] `sandbox-3-architecture.md` — referenced by 6 files
- [ ] `sandbox-3-runtime.md` — referenced by 5 files
- [ ] `sandbox-3-harness-v3.md` — referenced by 5 files
- [ ] `sandbox-3-monitoring.md` — referenced by 4 files
- [ ] `sandbox-3-deployment.md` — referenced by 4 files
- [ ] `sandbox-3-k8s.md` — referenced by 3 files
- [ ] `sandbox-3-determinism.md` — referenced by 3 files
- [ ] `sandbox-3-reproducibility.md` — referenced by 3 files
- [ ] `sandbox-3-stability-v3.md` — referenced by 2 files
- [ ] `sandbox-3-incident-response.md` — referenced by 2 files
- [ ] `sandbox-3-routing-v3.md` — referenced by 2 files
- [ ] `sandbox-3-firecracker.md` — referenced by 2 files
- [ ] `sandbox-3-vm-snapshotting.md` — referenced by 2 files
- [ ] `sandbox-3-alerting.md` — referenced by 2 files
- [ ] `sandbox-3-tracing.md` — referenced by 2 files
- [ ] `sandbox-3-syscall-trace.md` — referenced by 2 files
- [ ] `sandbox-3-network-trace.md` — referenced by 2 files
- [ ] `sandbox-3-overview.md` — referenced by 1 files
- [ ] `sandbox-3-progress.md` — referenced by 1 files
- [ ] `sandbox-3-firecracker-nodepool.md` — referenced by 1 files
- [ ] `sandbox-3-latency.md` — referenced by 1 files
- [ ] `sandbox-3-maal-integration.md` — referenced by 1 files

---

## Strategy 3: Fix Relative Path References (20+ links)

**Issue:** Relative paths using `../` that don't resolve correctly from docs/ structure.

**Examples to Fix:**

- `../rewrite-labs/rl-vault-setup.md` → likely should be `.rewrite-labs/rl-vault-setup.md`
- `../architecture/drift.md` → likely should be `.architecture/drift.md`
- `../batches/batch-39.md` → likely should be `.batches/batch-39.md`
- `../implementation/phase-26/summary.md` → likely should be `.implementation/phase-26/summary.md`
- `../../docs/reference/manifests.md` → likely should be `..docs/reference/manifests.md`
- `../operations/monitoring.md` → likely should be `.operations/monitoring.md`
- `../api/overview.md` → likely should be `.api/overview.md`
- `../rewrite-labs/00-rl-index.md` → likely should be `.rewrite-labs/00-rl-index.md`
- `../cic/governance.md` → likely should be `.cic/governance.md`
- `../meta/cic-os-doc-unification-2026-07-03.md` → likely should be `.meta/cic-os-doc-unification-2026-07-03.md`

---

## Strategy 4: Vault Reference Aliases (46+ links)

**Issue:** References to vault directory structure (`cic-ref/`, `rl-ref/`) that isn't in docs/.

**Solution Options:**
1. Create symlinks: `ln -s /path/to/vault docs/cic-ref`
2. Create redirect stubs in docs/ pointing to vault
3. Update all links to point to actual vault location

**Vault Paths Referenced:**

- `cic-ref/build-summary` — referenced by 4 files
- `rl-ref/system-overview` — referenced by 2 files
- `cic-ref/roadmap` — referenced by 2 files
- `rl-ref/agents` — referenced by 1 files
- `cic-ref/...` — referenced by 1 files
- `rl-ref/roadmap` — referenced by 1 files
- `rl-ref/" + $_.name.replace('.md','') + "` — referenced by 1 files
- `rl-ref/...` — referenced by 1 files
- `cic-ref/agents.md` — referenced by 1 files
- `cic-ref/cic_env_reference` — referenced by 1 files
- `cic-ref/agents_api` — referenced by 1 files
- `cic-ref/file` — referenced by 1 files

---

## All Broken Links by Source File

### `cic/index.md` (79 broken links)

- `../api/overview.md`
- `../architecture/overview.md`
- `../implementation/phase-26/summary.md`
- `../operations/running.md`
- `../reference/cic-rl-cross-reference.md`
- `../reference/system-index-builder.md`
- `../reference/toolforge.md`
- `../roadmaps/cic-roadmap.md`
- `../roadmaps/unified-roadmap.md`
- `canary-gates.md`
- `canary-phase-a-deployment.md`
- `canary-phase-a-prod-deployment-checklist.md`
- `cic-runtime-observability-plan.md`
- `cic-token-pack-v2-0-full-list.md`
- `driftengine.md`
- `execution-status.md`
- `governance.md`
- `harvester.md`
- `kb-integration-summary.md`
- `memory-v1-staging-activation.md`
- `p1-implementation-complete.md`
- `phases/phase-1-architecture.md`
- `phases/phase-1-bridge-orchestrator.md`
- `phases/phase-1-execution-log.md`
- `phases/phase-1-file-contract.md`
- `phases/phase-1-implementation-order.md`
- `phases/phase-1-ledger-substrate.md`
- `phases/phase-1-overview.md`
- `phases/phase-1-testing.md`
- `phases/phase-2-action-space.md`
- `phases/phase-2-architecture.md`
- `phases/phase-2-completion-log.md`
- `phases/phase-2-episode-trajectory.md`
- `phases/phase-2-integration.md`
- `phases/phase-2-overview.md`
- `phases/phase-2-policy-learner.md`
- `phases/phase-2-reward-function.md`
- `phases/phase-2-simulation-engine.md`
- `phases/phase-2-state-space.md`
- `phases/phase-2-status.md`
- `phases/phase-2-testing.md`
- `phases/phase-2-training-loop.md`
- `phases/phase-23-6-memory-explorer-ui.md`
- `phases/phase-27-4-dispatch.md`
- `phases/phase-28a-scp-completion.md`
- `phases/phase-3-completion-log.md`
- `phases/phase-30-mvp-spec.md`
- `phases/phase-5-canary-rollout-plan.md`
- `phases/phase-5c-deprecation-inventory.md`
- `phases/phase-8-spec.md`
- `phases/phase-8-test-matrices.md`
- `phases/phase-a-optimization-summary.md`
- `phases/phase-b-hardening-summary.md`
- `phases/phase-c-integration-summary.md`
- `phases/phase27-3-execution-plan.md`
- `phases/phase4-spec-locked.md`
- `phases/phase6-implementation-summary.md`
- `prometheus-integration-status.md`
- `replayharness.md`
- `research-skill/skill.md`
- `research-skill/test-results/iteration-1-grading.md`
- `research-skill/test-results/iteration-2-grading.md`
- `sandbox-3-architecture.md`
- `sandbox-3-determinism.md`
- `sandbox-3-incident-response.md`
- `sandbox-3-k8s.md`
- `sandbox-3-monitoring.md`
- `sandbox-3-overview.md`
- `sandbox-3-progress.md`
- `sandbox-3-routing-v3.md`
- `sandbox-3-stability-v3.md`
- `token-audit-report.md`
- `token-coverage-matrix-phase-roadmap.md`
- `token-coverage-matrix.md`
- `torquequery-build-summary.md`
- `torquequery-executive-summary.md`
- `torquequery-index.md`
- `torquequery-mcp-reference.md`
- `torquequery-quickstart.md`

### `cic/cic-maal-audit-overview.md` (28 broken links)

- `file:///c:/dev/cic-ingestion/src/drift/driftengine.ts`
- `file:///c:/dev/cic-ingestion/src/extractors/clientsessionextractor.ts`
- `file:///c:/dev/cic-ingestion/src/harness/replayharness.ts`
- `file:///c:/dev/cic-ingestion/src/harvester/index.ts`
- `file:///c:/dev/cic-ingestion/src/ingestion/queue/index.ts`
- `file:///c:/dev/dashboard.html`
- `file:///c:/dev/harvester-bridge/resolver.ts`
- `file:///c:/dev/jest.config.js`
- `file:///c:/dev/package.json`
- `file:///c:/dev/rewrite-mcp/castironforge/dashboard.html`
- `file:///c:/dev/src/maal/router/maal-router-types.ts`
- `file:///c:/dev/src/maal/router/sandbox-violation.ts`
- `file:///c:/dev/src/models/anythingllm.json`
- `file:///c:/dev/src/models/gpt4all.json`
- `file:///c:/dev/src/models/koboldcpp.json`
- `file:///c:/dev/src/models/llamafile.json`
- `file:///c:/dev/src/models/localai.json`
- `file:///c:/dev/src/models/ollama.json`
- `file:///c:/dev/src/providers/anythingllmprovider.ts`
- `file:///c:/dev/src/providers/gpt4allprovider.ts`
- `file:///c:/dev/src/providers/koboldcppprovider.ts`
- `file:///c:/dev/src/providers/llamafileprovider.ts`
- `file:///c:/dev/src/providers/localaiprovider.ts`
- `file:///c:/dev/src/providers/ollamaprovider.ts`
- `file:///c:/dev/src/slo-controller/canary-abort.ts`
- `file:///c:/dev/src/tests/dashboard-endpoints.test.ts`
- `file:///c:/dev/src/tests/feedback-loop.test.ts`
- `file:///c:/dev/src/tests/maal-routing-policy.test.ts`

### `cic/phases/phase-2-overview.md` (10 broken links)

- `phase-2-action-space.md`
- `phase-2-architecture.md`
- `phase-2-episode-trajectory.md`
- `phase-2-integration.md`
- `phase-2-policy-learner.md`
- `phase-2-reward-function.md`
- `phase-2-simulation-engine.md`
- `phase-2-state-space.md`
- `phase-2-testing.md`
- `phase-2-training-loop.md`

### `cic/phases/index.md` (8 broken links)

- `phase-1-overview.md`
- `phase-2-overview.md`
- `phase-3-completion-log.md`
- `phase-30-mvp-spec.md`
- `phase-31.md`
- `phase-4-migration-status.md`
- `phase-5-torquequery-v2-deployment-guide.md`
- `phase-8-spec.md`

### `reference/cic-rl-cross-reference.md` (7 broken links)

- `../architecture/routing.md`
- `../operations/monitoring.md`
- `../reference/knowledge-graph/quick-start.md`
- `../rewrite-labs/rl-vault-setup.md`
- `../roadmaps/cic-roadmap.md`
- `../roadmaps/rewrite-labs-roadmap.md`
- `../roadmaps/unified-roadmap.md`

### `cic/phase-27-wave-f-summary.md` (7 broken links)

- `./phase-27-ingestion-autonomy-locked.md`
- `./phase-27-wave-f-architecture.md`
- `./phase-27-wave-f-fixtures.md`
- `./phase-27-wave-f-rollback.md`
- `./phase-27-wave-f-runbook.md`
- `./phase-27-wave-f-ship-checklist.md`
- `./phase-27-wave-f-troubleshooting.md`

### `reference/setup-checklist.md` (6 broken links)

- `cic-ref/...`
- `cic-ref/build-summary`
- `rl-ref/" + $_.name.replace('.md','') + "`
- `rl-ref/...`
- `rl-ref/roadmap`
- `rl-ref/system-overview`

### `cic/phase-27-wave-f-ship-checklist.md` (6 broken links)

- `./phase-27-ingestion-autonomy-locked.md`
- `./phase-27-wave-f-architecture.md`
- `./phase-27-wave-f-fixtures.md`
- `./phase-27-wave-f-rollback.md`
- `./phase-27-wave-f-runbook.md`
- `./phase-27-wave-f-troubleshooting.md`

### `cic/torquequery-index.md` (6 broken links)

- `c:\dev\rewrite-mcp\services\torquequery-mcp\readme.md`
- `c:\dev\rewrite-mcp\services\torquequery-mcp\validation.md`
- `c:\dev\services\cic-substrate\schema.sql`
- `torquequery-build-summary.md`
- `torquequery-mcp-reference.md`
- `torquequery-quickstart.md`

### `cic/phases/phase-2-architecture.md` (6 broken links)

- `phase-2-action-space.md`
- `phase-2-overview.md`
- `phase-2-policy-learner.md`
- `phase-2-reward-function.md`
- `phase-2-state-space.md`
- `phase-2-training-loop.md`

### `reference/system-index-builder.md` (5 broken links)

- `../operations/weekly-sync.md`
- `../rewrite-labs/00-rl-index.md`
- `../roadmaps/unified-roadmap.md`
- `../systems/index.md`
- `cic-rl-cross-reference.md`

### `reference/toolforge.md` (5 broken links)

- `../architecture/drift.md`
- `../architecture/routing.md`
- `../roadmaps/cic-roadmap.md`
- `../roadmaps/unified-roadmap.md`
- `services.md`

### `cic/research-skill/skill.md` (5 broken links)

- `cic-ref/agents.md`
- `cic-ref/agents_api`
- `cic-ref/build-summary`
- `cic-ref/cic_env_reference`
- `cic-ref/roadmap`

### `reference/handbook.md` (4 broken links)

- `../architecture/overview.md`
- `../cic/governance.md`
- `../reference/schemas.md`
- `deployment.md`

### `reference/rl-vault-adapter-implementation.md` (4 broken links)

- `../lib/drift.ts`
- `../meta/cic-os-doc-unification-2026-07-03.md`
- `../operations/weekly-sync.md`
- `../rewrite-labs/rl-vault-manifest.json`

### `reference/knowledge-graph/readme.md` (4 broken links)

- `concept`
- `exact-link-name`
- `links`
- `wiki-links`

### `api/federation-layer.md` (4 broken links)

- `../batches/batch-37.md`
- `access-layer.md`
- `overview.md`
- `snapshot-layer.md`

### `api/overview.md` (4 broken links)

- `access-layer.md`
- `federation-layer.md`
- `seal-verify.md`
- `snapshot-layer.md`

### `api/seal-verify.md` (4 broken links)

- `../architecture/deterministic-stack.md`
- `../batches/batch-40.md`
- `../operations/sealing.md`
- `overview.md`

### `api/snapshot-layer.md` (4 broken links)

- `../batches/batch-39.md`
- `access-layer.md`
- `federation-layer.md`
- `overview.md`
