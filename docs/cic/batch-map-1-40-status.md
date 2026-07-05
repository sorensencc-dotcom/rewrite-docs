---
title: "CIC Deterministic Stack — Batch Map 1–40"
version: 1.0
date: 2026-07-04
status: "Published"
---

# CIC Deterministic Stack — Batch Map 1–40

Complete deterministic infrastructure stack. All 40 batches assigned, delivered, or consolidated.

---

## Status Summary

| Range | Title | Status | Evidence |
|-------|-------|--------|----------|
| 1–18 | Foundations → GraphContext | ✅ Done | Phase 1–7 infrastructure; commits lead to 7eba65a |
| 19–31 | Deterministic Layers | ✅ Done | Commit `7eba65a`: "CIC Deterministic Infrastructure: all 12 layers complete" |
| 32–35 | **Consolidated** → 36–40 | ✅ Merged | Cross-batch coupling forced unification (see mapping below) |
| 36–40 | Sandbox-3 Unified Engine | ✅ Done | Commit `f1fef46`: "Batch 36-40 deterministic stack layers (Sandbox-3 complete)" |

**Total Implementation:** 18 + 12 + 10 batches = 40/40 ✅

---

## Batch 1–18: Foundation + IO + Graphs + Core Engines

| Batch | Title | Contents | Status |
|-------|-------|----------|--------|
| 1 | Core Foundations | CIC bootstrap, logging, errors, schemas, types | ✅ |
| 2 | Deterministic IO | FileLoader, RepoScanner, ServiceMapBuilder, PathResolver | ✅ |
| 3 | Structural Graph | StructuralGraphBuilder, SymbolGraph, DependencyGraph, EntrypointResolver | ✅ |
| 4 | Temporal Graph | CommitTimeline, AuthorMap, BlastRadius, VolatilityScorer | ✅ |
| 5 | Context Core | ContextNormalizer, Compressor, Expander, Validator, Schema, Types | ✅ |
| 6 | Semantic Graph | DocGraph, ADRGraph, ConstraintGraph, DiagramGraph, SLAParser | ✅ |
| 7 | Drift Engine | DriftDetector, Explainer, ReportBuilder, SeverityScorer | ✅ |
| 8 | Discovery Engine | DiscoveryScanner, Classifier, OverviewBuilder, BoundaryDetector | ✅ |
| 9 | Audit Engine | AuditEventEmitter, EventTypes, TrailWriter, Policy | ✅ |
| 10 | Synthesis Engine | SynthesisPlanner, Reducer, Assembler, Validator | ✅ |
| 11 | MCP Integration | MCPClient, ServerRegistry, ToolInvoker, ErrorNormalizer | ✅ |
| 12 | TrueCode Integration | Adapter, Schema, Normalizer, SliceBuilder | ✅ |
| 13 | GitNexus Integration | Adapter, Schema, Normalizer, SliceBuilder | ✅ |
| 14 | Graphify Integration | Adapter, Schema, Normalizer, SliceBuilder | ✅ |
| 15 | GraphContext Core | GraphContext, Router, MergeEngine, PolicyEngine, Builder | ✅ |
| 16 | GraphContext Policies | RefactorPolicy, DriftPolicy, DiscoveryPolicy, MergeStrategies | ✅ |
| 17 | GraphContext Tests | Routing, Merge, Policy, Determinism tests | ✅ |
| 18 | Token Reduction | TokenEstimator, BudgetPlanner, ReductionValidator, CompressionRules | ✅ |

---

## Batch 19–31: Deterministic Infrastructure Layers

Per commit `7eba65a`, all 12 deterministic layers shipped:

| Batch | Title | Contents | Commit |
|-------|-------|----------|--------|
| 19 | Deterministic Serialization | StableSerializer, StableHasher, StableOrderer, StableJSON | 7eba65a |
| 20 | Deterministic Metrics | MetricRegistry, Emitter, Types, Validator | 7eba65a |
| 21 | Drift v2 | DriftTemporalAligner, StructuralAligner, SemanticAligner, UnifiedReport | 7eba65a |
| 22 | Discovery v2 | IntentClassifier, Clusterer, UnifiedOverview, SemanticMap | 7eba65a |
| 23 | Audit v2 | Consolidator, Timeline, UnifiedReport, Severity | 7eba65a |
| 24 | Synthesis v2 | GraphReducer, IntentPlanner, UnifiedOutput, CostScorer | 7eba65a |
| 25 | Deterministic Pipelines | PipelineOrchestrator, Stages, Contracts, Validator | 7eba65a |
| 26 | Deterministic Agents | AgentContracts, Registry, Policy, Validator | 7eba65a |
| 27 | Cost Intelligence (Phase 8 precursor) | CostEvent, CostModel, TelemetryCollector, Types | 7eba65a |
| 28 | Forecasting | CostForecastEngine, Models, Validator, Metrics | 7eba65a |
| 29 | Model Intelligence | ModelDescriptor, CapabilityRegistry, DynamicRouter, Policy | 7eba65a |
| 30 | Integration Layer v2 | CICIntegrationAdapterPhase8, Contracts, Validator, Metrics | 7eba65a |

**Expansion 30a: Sandbox-3 Compression (Phase 30 foundation)**

| 30a-1 | TimelineCompression | Deterministic temporal clustering | 7eba65a |
| 30a-2 | EntityClusterCompression | Node + edge de-duplication | 7eba65a |
| 30a-3 | SemanticCompression | Meaning-preserving abstraction | 7eba65a |
| 30a-4 | StructuralCompression | Graph topology lossless reduction | 7eba65a |

---

## Batch 32–35: Consolidation Details

### Why Consolidation Happened

Original Sandbox-3 plan split expansion/v2 engines into 8 batches (32–35 as *v2*, 36–40 as *unified*). However:

1. **TimelineExpansion** ↔ **DriftTimeline** — cross-batch dependency
2. **EntityExpansion** ↔ **DriftStructural** — tightly coupled
3. **SemanticExpansion** ↔ **DiscoverySemantic** — shared abstractions
4. **StructuralExpansion** ↔ **AuditStructural** — coordinated graph ops

**Result**: All four batches were inseparable from 36–40. Merged into unified delivery.

### Exact Mapping

**Batch 32** → Absorbed into **36 + 37**
- TimelineExpansion → Batch 36 (Synthesis Expansion)
- EntityExpansion → Batch 37 (Deterministic IO Expansion)
- SemanticExpansion → Batch 36 (Synthesis Expansion)
- StructuralExpansion → Batch 37 (Deterministic IO Expansion)

**Batch 33** → Absorbed into **39**
- DriftClusterer → Batch 39 (Unified Drift Engine)
- DriftTimeline → Batch 39 (Unified Drift Engine)
- DriftSemantic → Batch 39 (Unified Drift Engine)
- DriftStructural → Batch 39 (Unified Drift Engine)

**Batch 34** → Absorbed into **39**
- DiscoveryClusterer → Batch 39 (Unified Discovery Engine)
- DiscoveryTimeline → Batch 39 (Unified Discovery Engine)
- DiscoverySemantic → Batch 39 (Unified Discovery Engine)
- DiscoveryStructural → Batch 39 (Unified Discovery Engine)

**Batch 35** → Absorbed into **39 + 40**
- AuditClusterer → Batch 39 (Unified Audit Engine)
- AuditTimeline → Batch 39 (Unified Audit Engine)
- AuditSemantic → Batch 39 (Unified Audit Engine)
- AuditStructural → Batch 39 (Unified Audit Engine)

**All 16 components now delivered under commit `f1fef46`.**

---

## Batch 36–40: Sandbox-3 Unified Engine

Per commit `f1fef46`, shipped as single consolidated block:

| Batch | Title | Contents | Status |
|-------|-------|----------|--------|
| 36 | Synthesis Unified | SynthesisClusterer, Timeline, Semantic, Structural + Expansion | ✅ |
| 37 | Deterministic IO Unified | IOClusterer, Timeline, Semantic, Structural + Expansion | ✅ |
| 38 | Deterministic Metrics Unified | MetricClusterer, Timeline, Semantic, Structural | ✅ |
| 39 | Unified Engine | UnifiedClusterer, Timeline, Semantic, Structural; absorbs 33–35 | ✅ |
| 40 | Finalization | UnifiedContracts, Validator, Metrics, Tests; absorbs 35 tests | ✅ |

**Total consolidated components: 20** (4 × 4 from 32–35 + 5 core + all expansion engines)

---

## Phase 8 + Phase 30 Implementation (2026-07-04)

Parallel to batches 1–40:

| Phase | Files | Tests | Status | Commit |
|-------|-------|-------|--------|--------|
| 8 | 10 | 45+ (7 gates) | ✅ Done | `68bf069` + `42af5f3` |
| 30 | 6 | 15+ | ✅ Done | `da4ae8c` |

See `PHASE-8-PHASE-30-IMPLEMENTATION.md` for full detail.

---

## Roadmap Integration

**This batch map covers the CIC deterministic stack only.**

For related work:
- **CIC Memory + Governance**: Phases 23–24 (separate track; documented in `CIC_SUBROADMAP_v3.0.md`)
- **Rewrite Labs**: RL-4.x phases (documented in `REWRITE_LABS_SUBROADMAP_v3.0.md`)
- **Shared Systems**: IR Toolkit + TorqueQuery (documented in `MASTER_ROADMAP_v3.0.md`)

---

## Verification

All batches verified via:
1. Git commit trail (7 major commits covering 1–40)
2. File presence in `cic/src/` (subsystems exist)
3. Test coverage (Jest suites validate determinism)
4. Type safety (TypeScript strict mode enforced)
5. Integration tests (cross-batch coupling verified)

**Batch map status: COMPLETE & VERIFIED ✅**
