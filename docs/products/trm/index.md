---
title: "Topic Research Module (TRM)"
summary: "CLI that builds hierarchical, lineage-tracked research topic trees on the local filesystem, with a guardrail that keeps research data out of repos that have a remote."
tags:
  - products
  - trm
---

# Topic Research Module (TRM)

TRM is a command-line tool that stores research as a tree of topics on the local filesystem. You ingest sources, extract facts, score and promote topics, and crosslink related work. Every step is versioned JSON or text under a topic-tree root, and every mutating command appends an entry to that node's operation log. The README lists the version as 0.1.0 and the status as active, covering the CLI and the NotebookLM mining pipelines. The audience is CIC research operators and agents that maintain topic trees outside public remotes.

## Why it exists

Source PDFs, extracted facts, scores, and crosslinks between topics need an audit trail and a stable on-disk shape. They do not belong in a public git repo next to code. TRM provides the structure and enforces the separation in code.

Every command starts by running `assertSafeRoot(process.cwd())`, implemented in `src/core/rootSafety.ts`. The check walks up from the current directory looking for a `.git` folder. If it finds one whose `config` has a `[remote "..."]` section, the command refuses to run. A directory with no `.git`, or with a local-only repo such as a vault, passes silently. Setting `TRM_ALLOW_GIT_ROOT=1` overrides the check. The test for the guardrail runs against real ephemeral git repos, with and without a remote, not mocks.

## Data model

You run commands from inside a root directory. Topics live under `topics/<path>/` as slash-separated paths, for example `charlie/cuba`. Path depth sets the node type: one segment is a `project`, two is a `topic`, and three or more is a `subtopic`.

Each node directory holds:

- `topic.json` for metadata: version, actors, tags, status, and node type.
- `sources/raw/SRC-NNN.txt` for ingested source text, plus `sources/metadata.json` for per-source origin, type, and URL.
- `extracts/` for `extract.json` (facts), `score.json` (scoring output), and `summary.md` (human-readable summary).
- `lineage/lineage.json` for the append-only operation log: CREATE, INGEST, EXTRACT, SCORE, and so on.
- `crosslinks/` for links to related topics.

The wiki also describes a `topic.pack.v1` layout used by the scaffolding and audit tools. It pins each corpus file with a SHA-256 digest in `corpus/source_catalog.json`, holds generated `research.task.v1` task files under `specs/`, and keeps topic-specific audit rules in `config/audit_rules.json`. An operator approves the task boundaries before extraction workers run, and audited output goes to a staging queue in `_kb-sync-staging/` for the `kb-sync` knowledge base.

## Commands

Documented commands:

| Command | Purpose |
| --- | --- |
| `create` | Create a topic node and any missing ancestor containers. |
| `ingest`, `ingest-dir` | Ingest a single source, or recursively ingest a folder of PDF, image, video, and text files. |
| `ingest-notebooklm`, `mine-notebooklm` | Pull new or changed sources and notes from a registered NotebookLM notebook and run `sync-treatment`, or run the fixed research-gap question set against it. |
| `extract`, `score` | Extract facts from ingested sources, then score a topic. `score --rollup` rolls scores up to ancestors. |
| `crosslink`, `version-bump` | Record a relationship to another topic, or bump a node's semver `version`. |
| `validate` | Check a node's on-disk shape. Exits non-zero if any node is invalid. |

The CLI source in `src/cli` also registers `ingest-archive`, `reingest-urls`, `verify-cut`, `sync-treatment`, `report`, `feedback-stats`, `triage-intake`, `route-intake`, `research-notebooklm`, `archive-chats`, and `eval-whichllm`. The README and wiki do not document most of them, so read the CLI source before you rely on one. The wiki's CLI reference also lists `scaffold-topic`, which is not registered in `src/cli`; use `scaffold_topic.py` instead.

## Ingestion and mining

Images go through OCR and Vision analysis by way of the CIC ingestion service, set with `CIC_INGESTION_URL` (default `http://localhost:3000`). Video ingestion through `ingest-dir` handles `.mp4`, `.mov`, `.avi`, and `.mkv` files. It needs ffmpeg and ffprobe, and for files with an audio stream it needs a whisper.cpp build plus a ggml model. Those two rarely land on the PATH or cache defaults, so expect to set `TRM_WHISPER_BIN` and `TRM_WHISPER_MODEL`. Concurrency has defaults: 8 files for `TRM_IO_CONCURRENCY`, 4 Vision calls for `TRM_VISION_CONCURRENCY`, 2 ffmpeg processes, 3 frames per video, and 1 whisper transcription at a time.

`mine-notebooklm` appends new answers to `trm/research-gaps/<slug>.md` and writes urgent ones to `TODOS.md`. Two Python utilities sit beside the CLI: `scaffold_topic.py` scaffolds a topic testbed, and `topic_coverage_auditor.py` runs a three-tier audit for unindexed corpus files, unmapped entity clusters, and drift between `eventDate` and a topic's declared time horizon.

## Run it

```bash
git clone https://github.com/sorensencc-dotcom/TRM.git trm
cd trm
npm install
npm run build
npm run trm -- create charlie/example --description "demo topic"
```

`npm run trm -- <command>` runs without a build. After `npm run build`, use `node dist/cli/index.js <command>`. Run the command from a root directory that passes the safety check. Development scripts are `npm test` (jest, tmpdir-isolated), `npm run typecheck`, and `npm run build`.

## Where the writeups live

The full tree stays in the TRM repository. This page summarizes the README and the in-repo wiki.

- GitHub: [sorensencc-dotcom/TRM](https://github.com/sorensencc-dotcom/TRM)
- Product README: [README.md](https://github.com/sorensencc-dotcom/TRM/blob/main/README.md)
- Wiki home: [wiki/Home.md](https://github.com/sorensencc-dotcom/TRM/blob/main/wiki/Home.md)
- On-disk format and topic packs: [Architecture and data model](https://github.com/sorensencc-dotcom/TRM/blob/main/wiki/Architecture-%26-Data-Model.md)
- Root safety: [Security guardrails and root safety](https://github.com/sorensencc-dotcom/TRM/blob/main/wiki/Security-Guardrails-%26-Root-Safety.md)
- Flags per command: [CLI reference and commands](https://github.com/sorensencc-dotcom/TRM/blob/main/wiki/CLI-Reference-%26-Commands.md)
- Media pipeline: [Multimodal ingestion and media pipeline](https://github.com/sorensencc-dotcom/TRM/blob/main/wiki/Multimodal-Ingestion-%26-Media-Pipeline.md)
- NotebookLM: [NotebookLM and mining pipeline](https://github.com/sorensencc-dotcom/TRM/blob/main/wiki/NotebookLM-%26-Mining-Pipeline.md)
- Gap triage: [Closed-loop gap triage and RFC synthesis](https://github.com/sorensencc-dotcom/TRM/blob/main/wiki/Closed-Loop-Gap-Triage-%26-RFC-Synthesis.md)
- Scheduling: [Deployment and automation](https://github.com/sorensencc-dotcom/TRM/blob/main/wiki/Deployment-%26-Automation.md)
- Local checkout on machine: `C:\dev\trm`.
