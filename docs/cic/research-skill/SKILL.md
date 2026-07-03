---
name: cic-research
description: |
  Research CIC and Rewrite Labs architecture — synthesize answers from your vault docs instantly. Use this when learning how CIC phases work, understanding extractors and subsystems, exploring component relationships, navigating the ingestion pipeline, or diving into design decisions. Ask about flows, interactions, phase progression, architectural patterns, or how specific parts connect.
title: ""
summary: ""
created: "2026-07-03T19:44:37.790Z"
updated: "2026-07-03T19:44:37.790Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# CIC & Rewrite Labs Research

This skill synthesizes answers to architecture questions using your vault documentation as the source of truth. It handles questions about system design, component relationships, phases, extractors, and research navigation.

## When to Use

- **Component questions**: "How does the token pack system work?" → synthesizes from relevant docs
- **Relationship questions**: "What's the connection between Harvest and Sweep phases?" → explains interactions
- **Research navigation**: "What should I read to understand extractors?" → points to docs + related areas
- **Design reasoning**: "Why is the pipeline structured this way?" → explains architectural choices

## How It Works

The skill reads vault documentation from your structured knowledge base:
- **CIC docs** (`cic-ref/`): BUILD-SUMMARY.md, AGENTS.md, AGENTS_API.md, CIC_ENV_REFERENCE.md, CIC_RUNTIME_OBSERVABILITY_PLAN.md, CIC_TOKEN_PACK_v2_0_FULL_LIST.md, ROADMAP.md
- **Architecture docs** (`architecture/`): Design patterns and decisions (as they're added)
- **Rewrite Labs docs** (`rl-ref/`): System architecture (when mirrored)

When answering, the skill:
1. Identifies which docs contain relevant information
2. Synthesizes across multiple sources to answer the full question
3. Explains the reasoning and architectural intent
4. Cites specific vault docs with references (e.g., "See [[cic-ref/AGENTS.md]] for details")
5. Grounds explanations in documented content; flags inferences vs. direct evidence
6. Suggests related topics, next docs, and code files to explore
7. When vault docs don't fully cover a question, be honest about gaps instead of inferring

## Conceptual Explanations

Answers focus on *why* and *how* rather than code or implementation details. The goal is to build understanding of system design and relationships.

## Reference Format

**Vault docs:**
- Direct reference: "See [[cic-ref/BUILD-SUMMARY]] for the system overview"
- Specific section: "The ROADMAP explains phase sequencing; see [[cic-ref/ROADMAP]] for timeline details"
- Cross-reference suggestion: "Next, read [[cic-ref/AGENTS_API]] to understand how agents interact"

**Code anchors** (when applicable):
- "To see this in practice, look at `src/codeflow-extractor.ts` (normalizes CodeFlow output)"
- "The implementation lives in `cic/orchestrator.ts` (lines 45-120)"
- "Example: `src/codeflow-analyzer.js` demonstrates the static analysis pattern"

**When vault docs are incomplete:**
- Flag uncertainty: "ROADMAP mentions Phase 9 adaptive memory; implementation details TBD"
- Distinguish inferred vs. documented: "Inferred from observability plan, but not explicitly documented"
- Suggest confirmation: "This matches the pattern in BUILD-SUMMARY; check ROADMAP for the canonical source"

## Example Conversation

**User:** "How do extractors fit into the CIC pipeline?"

**Skill response would:**
1. Synthesize from BUILD-SUMMARY (overall pipeline), AGENTS.md (extractor patterns), and ROADMAP (phase sequencing)
2. Explain the role of extractors in each phase
3. Describe how they interact with the agent system
4. Reference specific vault docs
5. Suggest next reads: "To understand how extractors are discovered, see [[cic-ref/CIC_ENV_REFERENCE]]. To see them in practice across phases, read the ROADMAP."

## Architecture Questions You Can Answer

- What are the CIC phases and how do they sequence?
- How do extractors work and what types exist?
- What's the relationship between agents and extractors?
- How does the token pack system optimize ingestion?
- What observability signals matter for the pipeline?
- Why is [subsystem] designed this way?
- What should I read to understand [topic]?
- How do [X] and [Y] interact in the system?

## Future Expansion

Once the Rewrite Labs vault is mirrored, this skill will also handle RL architecture questions with the same synthesis approach. The user can ask cross-system questions like "How is CIC's extractive approach different from RL's generative approach?"
