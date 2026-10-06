---
title: "rewrite-mcp"
summary: "Rewrite Labs and CIC infrastructure monorepo: containerized agent builds, sealed Node.js builds, MCP servers, a skills runtime, and governance and planning services."
tags:
  - products
  - rewrite-mcp
---

# rewrite-mcp

rewrite-mcp is the monorepo the README calls "Rewrite Labs + CIC Infrastructure": deterministic multi-agent build orchestration plus a sealed Node.js build environment. It's a working tree with a lot in it, not a single package. The root `package.json` is `rewrite-mcp-monorepo`, with workspaces under `apps/`, `packages/`, `projects/`, and `tools/`. It is not rewrite-docs, which is this knowledge base.

The README's pipeline starts in `build-system/`. That directory holds the Dockerfiles, schemas, policies, and routing for containerized agents: CIC ingestion and evolution, Rewrite Labs discovery, extraction, GPU redesign, and outreach, plus a Nemotron inference agent that needs NVIDIA CUDA. `bash build-system/examples/build-all-agents.sh` builds them all. `thefoundry/` is the sealed build step. It has a `node-build` image that builds a Node.js project reproducibly and a `node-runtime` image that runs the result.

The MCP side lives in two places. `services/torquequery-mcp/` is a stdio MCP server that wraps the CIC Substrate Service over HTTP (`SUBSTRATE_URL`, default `http://localhost:3000`). Its tools are `store_chunk`, `search_chunks`, `get_task_context`, `get_chunk`, `list_chunks`, `update_chunk`, `delete_chunk`, and `get_stats`. `skills-runtime/` loads the skills under `skills/`, validates their inputs, and runs them with sandboxing and telemetry. It also carries approval guards for git, npm, MCP, docs, policy, and validation actions. Its `mcp-server.js` presents those skills to Claude Code as MCP tools, using the mappings in `skill-tool-config.json`.

`src/` holds the TypeScript services:
- governance packets, gates, council voting, and policy rails (`src/cic/governance/`)
- a memory substrate (`src/memory/`)
- a small vault server for writing and reading records (`src/vault/`)
- the planning console (`src/planning-console/`), an Express server on `PORT` (default 3000) with read-only `/api/*` views of governance decisions, approvals, ingestion, queue depth, cost, drift warnings, and guardrail blocks

The planning console also has `/api/analytics/*` routes for tool latency, token spend, error clusters, and per-session trajectories, backed by `src/analytics/`. The operator front ends live under `apps/`, and the shared design system and UI packages under `packages/`. `npm test` runs `tests/runAll.ts`. This repo uses "CIC" for more than one system, so check `docs/glossary.md` before assuming which one a document means.

## Where the writeups live

The full tree stays in the rewrite-mcp repository. This page is only the index.

- GitHub: [sorensencc-dotcom/rewrite-mcp](https://github.com/sorensencc-dotcom/rewrite-mcp)
- Product README: [README.md](https://github.com/sorensencc-dotcom/rewrite-mcp/blob/main/README.md)
- Agent build system: [build-system/README.md](https://github.com/sorensencc-dotcom/rewrite-mcp/blob/main/build-system/README.md)
- TheFoundry sealed builds: [thefoundry/README.md](https://github.com/sorensencc-dotcom/rewrite-mcp/blob/main/thefoundry/README.md)
- TorqueQuery MCP server: [services/torquequery-mcp/README.md](https://github.com/sorensencc-dotcom/rewrite-mcp/blob/main/services/torquequery-mcp/README.md)
- Skills runtime: [skills-runtime/README.md](https://github.com/sorensencc-dotcom/rewrite-mcp/blob/main/skills-runtime/README.md)
- Planning console: [src/planning-console/](https://github.com/sorensencc-dotcom/rewrite-mcp/tree/main/src/planning-console)
- CIC glossary: [docs/glossary.md](https://github.com/sorensencc-dotcom/rewrite-mcp/blob/main/docs/glossary.md)
- Docs tree: [docs/](https://github.com/sorensencc-dotcom/rewrite-mcp/tree/main/docs)
- Changelog: [CHANGELOG.md](https://github.com/sorensencc-dotcom/rewrite-mcp/blob/main/CHANGELOG.md)
- Local checkout on this machine: `C:\dev\rewrite-mcp`
