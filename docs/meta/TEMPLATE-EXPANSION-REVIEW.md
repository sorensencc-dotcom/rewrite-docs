# Review: Template Expansion Pack Plan vs Repository State

**Reviewed:** 2026-06-13T00:00:00Z  
**Reviewer:** ijfw-review  
**Domain:** software + design (planning artifact)  
**Scope:** Session plan for 5-vertical template expansion vs current repo structure, roadmap, and Rewrite Labs integration

---

## Summary

Session plan proposes **template-expansion-pack/** directory with 5 new vertical templates (dental, legal, fitness, landscaping, salon/spa), 4 HTML/CSS skeletons, 6 component schemas, 5 outreach sequences, and 5 AEO metadata packs. 

**Critical gap:** Template expansion is **not in the master roadmap**, has **no assigned phase**, **no timeline**, and **no explicit scope in Rewrite Labs pipeline**. Plan is operationally sound but orphaned from CIC governance. Directory structure is good but needs roadmap home.

---

## BLOCK Findings (Must-Fix)

- **Roadmap Integration Missing**: Template expansion pack is not in `CIC_MASTER_ROADMAP.md`. No phase number, no timeline, no dependencies documented. Before creating artifacts, add phase spec to roadmap (e.g., Phase 28c, Phase 29, or "Rewrite Labs Vertical Expansion"). Lock phase number and timeline in roadmap before generating files.

- **Rewrite Labs Pipeline Scope Unclear**: Phase 0.7 references "Labs redesign GPU" and "Labs outreach" but does NOT explicitly scope vertical-template generation, template manifests, or vertical-specific schemas. Clarify whether template expansion is Phase 0.7 deliverable or separate phase. If separate, assign it a phase and add to 0.7 dependencies.

- **No Vertical-Specific Design Spec**: Plan lists 5 new verticals but repo has no existing vertical design guidelines, color palettes, or typography specs. Cannot generate "vertical-specific templates" without canonical vertical profiles locked first. Define vertical profiles in a separate artifact before creating manifests.

---

## FLAG Findings (Should-Discuss)

- **Directory Location Unvetted**: Proposal places pack at `docs/rewrite-labs/template-expansion-pack/`. This aligns with existing hierarchy but lacks operator approval. Check with CIC governance team: should this be in `docs/`, `data/`, `cic-ingestion/`, or `rewrite-mcp/`? Location should reflect how CIC will ingest and version these assets.

- **Component Inventory Dependency**: Plan generates 6 component schema files but lists no source. Are components extracted from existing 4 verticals (plumber, restaurant, roofing, auto repair) or new? If new, Harvester run must complete first. Clarify order: harvest existing 4 → extract components → define 5 new verticals.

- **AEO Metadata Schema Assumption**: Plan includes AEO packs (entity graphs, LocalBusiness schema, etc.) but repo may have existing AEO standards. Check whether `codeflow-api-contract.json` or Phase 7 ARL governance define entity/schema patterns. Reuse existing schemas rather than inventing new ones.

- **Outreach Copy Triage Unclear**: Plan mentions "high-conversion outreach sequences (3–5 emails per vertical)" but no user research or A/B test baseline. How do we validate conversion assumptions? Link to COMMERCIALIZATION-BLUEPRINT.md or past outreach performance before generating copy.

---

## NIT Findings (Polish)

- **Naming Convention Conflict**: Plan uses `salon_spa.json` (snake_case) but existing Rewrite Labs docs use kebab-case (`agent-template.md`). Standardize: either all `dental-template`, `legal-template` (kebab) or all `dental_template`, `legal_template` (snake). Recommend kebab-case to match existing style.

- **Version Metadata**: Plan includes `"version": "v1.0.0"` in artifacts but no `generated_at` timestamp format specified. Use ISO-8601 format consistently: `"generated_at": "2026-06-13T00:00:00Z"`.

- **Missing Manifest Index**: Plan proposes 5 separate manifest files but no index or registry listing all available templates. Create `manifests/INDEX.json` or `template-registry.json` as single source of truth for template discovery.

---

## Recommendations (Before Generating)

### 1. **Lock Roadmap Phase** (BLOCKING)
Add to `CIC_MASTER_ROADMAP.md`:
```
## PHASE 28c — Rewrite Labs Vertical Expansion

**Status:** PENDING  
**Purpose:** Extend template coverage from 4 verticals to 9 (add: dental, legal, fitness, landscaping, salon/spa)  
**Scope:**  
- Extract vertical profiles from existing 4 sites (component inventory, color/typography)  
- Define 5 new vertical profiles via Harvester analysis  
- Generate manifests, skeletons, schemas, outreach copy, AEO packs  
- Integrate into Redesign Engine for deployment  

**Dependencies:** Phase 0.7 (Rewrite Labs pipeline), Phase 24 (governance integration)  
**Timeline:** 2026-06-15 → 2026-06-29 (2 weeks)  
**Deliverables:** 5 template packs, component inventory, outreach sequences, AEO metadata
```

### 2. **Define Vertical Profiles First**
Before generating manifests, create:
```
docs/rewrite-labs/vertical-profiles/
  ├── canonical-profiles.md (tone, color, typography, hero archetype per vertical)
  ├── dental-profile.json
  ├── legal-profile.json
  ├── fitness-profile.json
  ├── landscaping-profile.json
  └── salon_spa-profile.json
```

### 3. **Extract Component Inventory**
Run Harvester on existing 4 verticals first:
```
npm run harvest -- --mode=style --batch=seeds/*.json --out=dist/component-inventory/
```
Lock component catalog before generating manifests.

### 4. **Standardize Naming & Schema**
- Use kebab-case for all files: `dental-manifest.json`, not `dental.json`  
- Create canonical schema: `docs/rewrite-labs/TEMPLATE-SCHEMA.md`  
- Include version, generated_at, vertical_id, dependencies in every manifest  

### 5. **Link to Existing Assets**
Check before inventing:
- `codeflow-api-contract.json` — reuse API versioning pattern  
- `docs/COMMERCIALIZATION-BLUEPRINT.md` — reuse tier/pricing structure  
- Phase 0.7 agents.md — validate Labs agents cover vertical template generation  

---

## Artifact Structure Assessment

**Proposed:**
```
docs/rewrite-labs/template-expansion-pack/
├── manifests/ (5 JSON files)
├── skeletons/ (4 HTML files)
├── schemas/ (6 JSON files)
├── outreach/ (5 Markdown files)
└── aeo/ (5 JSON files)
```

**Verdict:** Structure is clean and hierarchical. ✅ APPROVED pending roadmap integration.

---

## Next Steps

1. **Add Phase 28c to master roadmap** — submit for approval  
2. **Create vertical-profiles/** directory with canonical profiles  
3. **Run Harvester on existing 4 sites** — lock component inventory  
4. **Create TEMPLATE-SCHEMA.md** — canonical manifest/skeleton/component schema  
5. **Generate template-expansion-pack/** — use locked profiles + inventory as inputs  

**Do not** generate manifests, skeletons, or outreach copy until Phase 28c is in the roadmap and vertical profiles are locked.

---

## Approval Gate

**Status:** 🚫 **CONDITIONAL**  

- ✅ Directory structure sound  
- ✅ Plan operationally coherent  
- ❌ Not in roadmap (blocking)  
- ❌ Vertical profiles undefined (blocking)  
- ❌ Component inventory not extracted (blocking)  

**Decision:** Generate the roadmap phase spec. Lock vertical profiles. Extract component inventory. THEN generate pack artifacts.
