# CIC Research Skill - Evaluation Results

## Grading Rubric

| Criterion | Weight | Definition |
|-----------|--------|-----------|
| **Synthesis** | 25% | Connects multiple vault docs; doesn't just cite single source |
| **Vault References** | 20% | Explicitly cites cic-ref/ docs; uses backlink format |
| **Architectural Reasoning** | 20% | Explains *why* the system is designed this way |
| **Navigation Value** | 20% | Points user to next topics; builds learning path |
| **Accuracy** | 15% | Information is correct based on vault docs |

---

## EVAL-1: "How do extractors fit into the CIC pipeline?"

### WITH SKILL
**Score: 8.5/10**

✅ **Synthesis (25%):** 9/10
- Synthesized across BUILD-SUMMARY (layers), AGENTS.md (design principles), AGENTS_API.md (execution model), ROADMAP (phase sequencing), observability plan
- Connected extractors across phases with clear role evolution

✅ **Vault References (20%):** 9/10
- Used explicit backlink format: `[[cic-ref/BUILD-SUMMARY]]`
- Cited specific sections (Layers 1-5, Sections 11.1-11.3)
- Clear sourcing

✅ **Architectural Reasoning (20%):** 8/10
- Explained Forge Field principles (determinism, bounded authority, signal fidelity)
- Explained why extractors are NOT agents
- Described checkpoint integrity and minimal footprint

✅ **Navigation Value (20%):** 8/10
- Suggested 5 next reads: ENV_REFERENCE, ROADMAP phase 9, AGENTS_API, BUILD-SUMMARY layer 3, error handling
- Structured as progressive exploration

✅ **Accuracy (15%):** 8/10
- Accurate on extractor lifecycle, orchestration model
- Accurate on agent phase structure
- One minor inference: specific extractor types (TypeScript analyzer, vulnerability scanner) are design patterns, not fully documented

---

### BASELINE (No Skill)
**Score: 7/10**

✅ **Synthesis (25%):** 6/10
- Drew from codebase exploration (browser extractors, SweeperRouter, MemoryStore)
- Less cross-document synthesis; more implementation-focused

✅ **Vault References (20%):** 4/10
- No vault document citations
- Referenced file paths instead (`/extractors/browser/IBrowserEngine.ts`)

✅ **Architectural Reasoning (20%):** 7/10
- Explained permission model, execution context registration, audit trail
- Good on why determinism/fallback matter
- Didn't reference agent design principles

✅ **Navigation Value (20%):** 7/10
- Suggested specific files to read
- Provided real-world example (SMB website ingestion)
- No next conceptual topics

✅ **Accuracy (15%):** 8/10
- Accurate on browser engine interface, routing logic, memory ingestion
- Accurate on permission model

**DELTA:** +1.5 points (with-skill superior in synthesis, vault grounding, conceptual navigation)

---

## EVAL-2: "Harvest/Sweep phases and token packs?"

### WITH SKILL
**Score: 7/10**

✅ **Synthesis (25%):** 7/10
- Synthesized ROADMAP.md + CIC_CONTEXT + BUILD-SUMMARY
- Made reasonable inferences (Harvest = ingestion, Sweep = maintenance)
- Provided phase interaction table with token role

✅ **Vault References (20%):** 7/10
- Referenced docs but less explicitly than eval-1
- Acknowledged inference vs. direct documentation

✅ **Architectural Reasoning (20%):** 7/10
- Explained token pack as economic glue
- Connected determinism boundary, retention policy, cost feedback loop
- Good reasoning but limited by vault content

✅ **Navigation Value (20%):** 8/10
- Suggested 5 related areas
- Pointed to Phase 26 (deterministic flow), Phase 23.2-23.6 (memory infrastructure)

✅ **Accuracy (15%):** 6/10
- Some inferences go beyond documented content
- Harvest/Sweep terminology may not be standard CIC jargon
- Token pack connections are plausible but not explicitly documented

---

### BASELINE (No Skill)
**Score: 6/10**

✅ **Synthesis (25%):** 5/10
- Looked for explicit documentation; found limited direct references
- Acknowledged "not explicitly defined"

✅ **Vault References (20%):** 3/10
- Mentioned Caveman compression, Phase 25→26
- No direct doc citations

✅ **Architectural Reasoning (20%):** 6/10
- Explained Caveman budget concept
- Reasonable inference about token budgeting
- Less architectural depth

✅ **Navigation Value (20%):** 5/10
- Suggested checking working memory / commit messages
- Didn't provide clear next steps

✅ **Accuracy (15%):** 7/10
- Honest about gaps in documentation
- Accurate on Caveman compression

**DELTA:** +1 point (with-skill provides more synthesis despite uncertainty; baseline more cautious)

---

## EVAL-3: "Learning path for new CIC learner?"

### WITH SKILL
**Score: 8/10**

✅ **Synthesis (25%):** 8/10
- Synthesized BUILD-SUMMARY + ROADMAP + context into 6-phase progression
- Connected strategic → principles → code → operations

✅ **Vault References (20%):** 7/10
- Referenced vault docs (BUILD-SUMMARY, ROADMAP, etc.)
- Used backlinks
- Could have cited more explicitly

✅ **Architectural Reasoning (20%):** 8/10
- Explained why order matters: "why before how, principles before details"
- Highlighted HTTP as glue, determinism enabling composition
- Good scaffolding rationale

✅ **Navigation Value (20%):** 9/10
- Clear 6-phase progression with time estimates (3-4 hours)
- Explained why each phase builds on previous
- Highlighted key interconnections to watch

✅ **Accuracy (15%):** 8/10
- Accurate on phases and architecture
- Good on architectural principles

---

### BASELINE (No Skill)
**Score: 8/10**

✅ **Synthesis (25%):** 8/10
- Also created 6-phase progression
- Similar structure to with-skill version

✅ **Vault References (20%):** 6/10
- Provided file paths but less vault-grounded
- More implementation-focused

✅ **Architectural Reasoning (20%):** 8/10
- Explained layer contracts, determinism, observability as built-in
- Good rationale for learning order

✅ **Navigation Value (20%):** 9/10
- Provided specific file paths for each phase
- Mental model checkpoint (self-assessment questions)
- Pro tips for learning
- Code deep-dive guidance by domain

✅ **Accuracy (15%):** 9/10
- Accurate and practical
- Good on local deployment

**DELTA:** ~0 points (baseline slightly better on practical implementation guidance; with-skill slightly better on architectural narrative)

---

## SUMMARY

| Eval | With-Skill | Baseline | Delta | Winner |
|------|-----------|----------|-------|--------|
| **1 (Extractors)** | 8.5 | 7.0 | +1.5 | With-Skill ✅ |
| **2 (Harvest/Sweep)** | 7.0 | 6.0 | +1.0 | With-Skill ✅ |
| **3 (Learning Path)** | 8.0 | 8.0 | 0 | Tie 🤝 |

**Average:** With-Skill = 7.83, Baseline = 7.0
**With-Skill Advantage:** +0.83 points (12% improvement)

---

## Key Findings

### Strengths (With-Skill)
1. **Better synthesis** — Connects multiple vault docs naturally
2. **Vault grounding** — Uses backlink format, cites sources explicitly
3. **Conceptual navigation** — Points to next architectural topics, not just files
4. **Reasoning depth** — Explains design intent (Forge Field, determinism)

### Weaknesses (With-Skill)
1. **Eval-2 accuracy** — Makes inferences beyond documented content
2. **Vault dependency** — Only as good as vault documentation completeness
3. **Limited on implementation** — Less practical guidance on code locations/deployment

### Baseline Strengths
1. **Practical grounding** — File paths, code references, deployment steps
2. **Honest about unknowns** — Acknowledges gaps vs. inferring
3. **Self-assessment** — Mental model checkpoints

---

## Recommendation

**Keep the skill.** With-Skill is better at synthesis and navigation (+12% average). The vault is now the authoritative reference, so using it as the knowledge base is aligned with your architecture.

**Next iteration:** Add practical anchors — when referencing a concept, suggest "See `src/codeflow-analyzer.ts` to see extractors in action."

