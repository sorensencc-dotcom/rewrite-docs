# Toolforge Reference

Toolforge is the operational skill platform at `c:\dev\toolforge\`. Its own roadmap is `toolforge/ROADMAP.md` (note: `cic/ROADMAP.md` carries a `<!-- SYNC:TOOLFORGE -->` marker — it is a synced copy of the Toolforge roadmap, **not** the CIC phase roadmap; CIC phases live in the [CIC Roadmap](../roadmaps/cic-roadmap.md)).

**Status legend:** ✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential · ⛔ Deprecated

## Platform layout

Top-level: `skills/`, `adapters/`, `api/`, `audit/`, `daemons/`, `drift/`, `health/`, `mcp-servers/`, `prototypes/`, `scaffolds/`, `sync-tools/`, `utilities/`, plus operator docs (`OPERATOR_GUIDE.md`, `TOOL_CREATION_GUIDE.md`, `GOVERNANCE.md`, `INDEX.md`) and automation scripts (`ci-pipeline.ps1`, `setup-all-automation.ps1`, `multi-repo-orchestrator.ps1`).

## Skills — ✅

`toolforge/skills/` contains 10 skills (+ `_TEMPLATE`):

| Skill | Purpose |
|-------|---------|
| `work-summarizer` | Session/work summarization (v2.0, production) — includes drift detection (below) |
| `analyze-token-burn` | Token usage analysis |
| `kb-sync-nightly` | Nightly knowledge-base sync |
| `reconcile-vector-store` | Vector store reconciliation |
| `roadmap-validator` | Roadmap validation |
| `rollback-phase` | Phase rollback |
| `run-adapter-diagnostic` | Adapter diagnostics |
| `scale-ingestion-service` | Ingestion service scaling |
| `tool-lifecycle-manager` | Tool lifecycle management |
| `toolforge-drift-monitor` | Toolforge-level drift monitoring |

Required skill structure (per repo CLAUDE.md policy): `skill.json` + `README.md` + `src/` + `tests/` + `docs/USAGE.md`. Skill-pack metadata: `skills/SKILLPACK-METADATA.json`, dependency graph, runtime health, and validation docs live alongside.

### work-summarizer drift detector

`toolforge/skills/work-summarizer/src/drift-detector.ts` — scans session files for keyword-based drift signals (one of **four** distinct drift systems; see the disambiguation table in [Drift Classification](../architecture/drift.md)).

## FallbackChain

The canonical fallback chain implementation is `src/resilience/fallbackChain.ts` (repo `src/`, **not** inside work-summarizer): priority-ordered providers with circuit-breaker states (CLOSED/OPEN/HALF_OPEN) and a consecutive-failure threshold. Used by CIC routing — see [Routing](../architecture/routing.md).

## 💡 Agents — Potential (not implemented)

`toolforge/agents/` (with outreach/delivery/analysis subdirectories) **does not exist**. Nearest specced work: RL-4.5 OutreachAgent (`roadmap-runner/phases/RL-4.5.yaml`, build-config locked, runner pending). Treat any reference to Toolforge agent directories as a proposal until the directory and code land.

## Related

- [Unified Roadmap](../roadmaps/unified-roadmap.md) — shared-agents section
- [Services Reference](services.md) — Gemini Coach / Antigravity IDE (separate from Toolforge)
