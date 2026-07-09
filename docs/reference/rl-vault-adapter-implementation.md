---
title: "RL Vault Adapter Implementation"
created: "2026-07-04"
tags:
  - rl-vault
  - ingestion
  - torquequery
  - architecture
---

# RL Vault → CIC Ingestion Adapter

**Status:** Implemented (v1.0)  
**Version:** 1.0  
**Namespace:** `RLVaultAdapter`  
**Collection:** `rl-vault` (TorqueQuery)

---

## Overview

RL Vault is now a **first-class ingestion source** alongside CIC vault. The `RLVaultAdapter` coordinates a deterministic 6-stage pipeline:

1. **Discover** — scan vault, verify against manifest
2. **Harvest** — read files, extract frontmatter, infer titles
3. **Normalize** — strip comments, normalize tabs/headings, resolve links
4. **Chunk** — 1200-char max, 120-char overlap, deterministic IDs (`rlv-{sha256}-{index}`)
5. **Embed** — generate embeddings (stub → real embedding service in Phase X)
6. **Index** — push to TorqueQuery (stub → Qdrant in Phase X)

Full pipeline orchestrated via `run('ingest', {})` action.

---

## Files Added/Modified

### Core Adapter

| File | Lines | Purpose |
|------|-------|---------|
| `src/adapters/RLVaultAdapter.ts` | 420 | 6-stage ingestion pipeline; action dispatch |
| `src/adapters/index.ts` | +3 | Register adapter in registry |

### Configuration

| File | Change |
|------|--------|
| `roadmap-runner/ingestion-config.json` | Add `rl-vault` source block: patterns, adapter ref, stages |

### Observability

| File | Change |
|------|--------|
| `src/lib/drift.ts` | Merge: keep `detectDrift()` + add drift domain registration |
|  | New: `DriftDomain` interface, `rl-vault` domain with 0.8 weight |
|  | New: `getDriftDomain()`, `listDriftDomains()`, `matchesDriftDomain()`, `computeAggregateDriftScore()` |

### Operations

| File | Change |
|------|--------|
| `docs/operations/weekly-sync.md` | Renumber: Step 8→8 (RL sync), Add Step 9 (adapter ingest), Step 10 (close out) |

### Tests

| File | Lines | Purpose |
|------|-------|---------|
| `src/adapters/__tests__/RLVaultAdapter.test.ts` | 280 | 6 unit + 4 smoke tests |
| `src/lib/drift.test.ts` | 190 | Domain registration + scoring tests |

---

## Architecture

### Adapter Class

```ts
class RLVaultAdapter {
  constructor(vaultPath, manifestPath)
  async run(action, payload): Promise<AdapterResponse>
  
  // Stage methods
  private discover(): VaultFile[]
  private harvest(files): VaultFile[]
  private normalize(files): VaultFile[]
  private chunk(files): Chunk[]
  private embed(chunks): EmbeddingResult[]
  private index(embeddings): {indexed, failed}
  
  // Orchestration
  private runFullPipeline(): {discovered, chunked, embedded, indexed, durationMs}
}
```

### Configuration Block

```json
{
  "id": "rl-vault",
  "name": "Rewrite Labs Vault",
  "enabled": true,
  "adapter": "rl-vault",
  "stages": ["discover", "harvest", "normalize", "chunk", "embed", "index"],
  "source": "C:/dev/rl-ref",
  "patterns": ["**/*.md"],
  "exclude": ["**/ROADMAP.md"]
}
```

### Drift Domain

```ts
{
  id: "rl-vault",
  name: "Rewrite Labs Reference Vault",
  weight: 0.8,
  patterns: ["docs/rewrite-labs/**", "docs/architecture/**"],
  vaultPath: "C:/dev/rl-ref",
  refreshInterval: 3600
}
```

---

## Integration Points

### TorqueQuery Index

- Collection: `rl-vault`
- Vector index: Qdrant (Phase 0.1-A)
- Metadata index: CIC's KV store
- Chunk ID format: `rlv-{sha256-of-path}-{chunk-index}`

### Drift Scoring

- Domain weight: 0.8 (slightly lower than CIC vault 1.0)
- Patterns: `docs/rewrite-labs/**` + `docs/architecture/**`
- Vault path: `C:/dev/rl-ref`
- Refresh interval: 3600s (hourly)
- Integration: `computeAggregateDriftScore()` weights by domain

### Weekly Sync

Step 9 (new):
```bash
# Run full RL vault ingestion pipeline
node -e "const {RLVaultAdapter} = require('./src/adapters/RLVaultAdapter'); new RLVaultAdapter().run('ingest', {})"

# OR via roadmap-runner
roadmap-runner --phase RL-INGEST
```

Verify: indexed chunk count ≥ 14 files (typically 50–100 chunks)

---

## Testing

### Unit Tests (6)

1. **discover** — files listed in manifest
2. **discover** — fails if manifest missing
3. **discover** — fails if vault file missing
4. **harvest** — extracts frontmatter + content
5. **harvest** — infers title from H1
6. **normalize** — strips HTML comments (except SYNC)

### Smoke Tests (4)

1. **Full pipeline** — runs without error
2. **Pipeline timing** — returns `durationMs` metric
3. **Pipeline integrity** — file counts consistent across stages
4. **Error handling** — unknown action returns error

### Drift Tests (10)

1. Domain retrieval by ID
2. RL vault domain configuration
3. Pattern matching (CIC, RL, roadmap)
4. Aggregate drift scoring
5. Weight validation
6. Domain completeness

---

## Known Stubs

Production readiness: **80%** (stubs for embedding + index)

| Stage | Status | Notes |
|-------|--------|-------|
| Discover | ✅ READY | File scanning + manifest verification |
| Harvest | ✅ READY | File I/O + frontmatter extraction |
| Normalize | ✅ READY | HTML comment stripping + heading normalization |
| Chunk | ✅ READY | Deterministic chunking with ID generation |
| Embed | ⚠️ STUB | Mock embeddings (384-dim vectors); needs real embedding service |
| Index | ⚠️ STUB | Mock indexing; needs Qdrant integration |

### Embedding Service (Phase X)

Replace mock vector generation with:
```ts
const embedding = await torqueQueryClient.embed(chunk.text);
```

### Qdrant Integration (Phase X)

Replace mock indexing with:
```ts
await qdrantClient.upsert('rl-vault', {
  id: chunk.id,
  vector: embedding,
  payload: chunk.metadata
});
```

---

## Metrics

Instrumented via `metricsExporter`:

| Counter | Description |
|---------|-------------|
| `rl_vault_discover_total` | Discover stage invocations |
| `rl_vault_harvest_total` | Harvest stage invocations |
| `rl_vault_normalize_total` | Normalize stage invocations |
| `rl_vault_chunk_total` | Chunk stage invocations |
| `rl_vault_embed_total` | Embed stage invocations |
| `rl_vault_index_total` | Index stage invocations |

| Gauge | Description |
|-------|-------------|
| `rl_vault_files_discovered` | Files in vault |
| `rl_vault_chunks_produced` | Chunks after chunking |
| `rl_vault_indexed` | Successfully indexed chunks |
| `rl_vault_index_failed` | Failed index operations |
| `rl_vault_pipeline_duration_ms` | Full pipeline elapsed time |

---

## Versioning

- **RL Roadmap:** Minor bump (new subsystem)
- **CIC Master Roadmap:** Patch bump (new ingestion source)

---

## Next Steps

1. Wire embedding service (TorqueQuery API)
2. Wire Qdrant indexing
3. Add dashboard node for RL vault status
4. Run first weekly sync (step 9)
5. Monitor drift forecasts for RL vault domain

---

## Related Docs

- [CIC-OS Doc Unification](../meta/cic-os-doc-unification-2026-07-03.md) — 25-doc manifest validation
- [RL Vault Manifest](../rewrite-labs/rl-vault-manifest.json) — source of truth for sync
- [Weekly Sync Procedure](../operations/weekly-sync.md) — step 9 runs this adapter
- `Drift Domain Registration` — RL vault domain config
