---
title: "Toolforge"
summary: "Governed tool-execution platform for AI agents, plus the CIC governance packages and the doc sync that publishes product wikis."
tags:
  - products
  - toolforge
---

# Toolforge

Toolforge is the governed layer between AI agents and the tools they call. The README describes every call going through one pipeline. The gateway authenticates the request with an API key or JWT. Capability-based RBAC decides whether that agent may use that tool. The arguments are checked against the tool's JSON Schema. The tool runs in a Docker or subprocess sandbox with retry and timeout rules, and the result comes back as a structured `ToolResult` with an execution ID, latency, retries, and error details. PostgreSQL keeps the audit log, Redis holds rate limits and cache state, and Prometheus scrapes `/metrics`. Agents reach it over MCP (stdio or HTTP), and the README names adapters for LangGraph, OpenAI function calling, and IDE integrations. It has nothing to do with Wikimedia Toolforge.

The repo also carries a governed agent dispatcher under `tools/agent-dispatch/`. The README calls it the TorqueQuery hybrid dispatcher. It verifies a signed task contract through the Sigil verifier boundary, applies a zero-cost route and trusted-catalog policy, makes at most three sequential attempts, and writes a structured result with contract, operator, termination, and artifact metadata. Provider adapters cover local subscription CLIs, Ollama, and OpenRouter. Live provider execution stays opt-in and needs explicit operator configuration.

`GOVERNANCE.md` sets the house rules for tools. Every tool belongs to one category (`sync-tools`, `daemons`, `adapters`, `mcp-servers`, `utilities`, `scaffolds`, or `prototypes`) and uses kebab-case directory names. It follows semantic versioning, starting at 0.1.0 and reaching 1.0.0 only when it's stable, documented, and tested, and it registers in `manifest.json`. Platform releases are cut by the `Toolforge Release` workflow. On a push to `main` that touches more than docs, Markdown, or workflow files, it picks the bump from the Conventional Commit prefix and publishes a GitHub release. The Helix, ICF, and Toolforge Marketplace folders in this repo are pointers to their own repositories, each with its own index page here.

`CIC-GOVERNANCE/` groups the Cast Iron Charlie governance artifacts. Its README marks the directory "IMPLEMENTED CANDIDATE — NOT OPERATIONAL" and says it doesn't outrank repository governance. Its npm workspace holds `@cic/delivery-guard` and four WhichLLM packages, and the root `*:whichllm` scripts (`sweep`, `decide`, `plan`, `simulate`, `install`, `test`) run through it. Delivery guard is the piece CI leans on. A repository adapter (Toolforge's is `CIC-GOVERNANCE/delivery-guard.config.js`) names the automation paths. Any commit that changes one of them has to add or change a regression test in the same commit. The Governance workflow blocks on that, and the local pre-commit hook only warns. The package also writes sanitized push receipts outside the repo, and it has a budget ledger and a guarded provider wrapper that reserve model spend before dispatch.

Product wikis are published from here by `npm run docs:sync` (`scripts/doc-sync/run.mjs`). It reads `docs/meta/governance/wiki-sync-registry.json`, runs only the rows marked enabled, takes a lock so two syncs can't overlap, supports `--dry-run` and `--product=<name>`, and leaves a `.wiki-sync-receipt.json` in the product repo after a real sync. On `main`, every row in that registry is `enabled: false`. A GitHub wiki is a publish target, not where the docs are authored. The registry's own notes say `C:\dev\wiki\**` is a generated quarantine, and that it must never be treated as the twin of any product wiki.

## Where the writeups live

The full tree stays in the Toolforge repository. This page is only the index.

- GitHub: [sorensencc-dotcom/toolforge](https://github.com/sorensencc-dotcom/toolforge)
- Product README: [README.md](https://github.com/sorensencc-dotcom/toolforge/blob/main/README.md)
- Tool naming, versioning, and lifecycle: [GOVERNANCE.md](https://github.com/sorensencc-dotcom/toolforge/blob/main/GOVERNANCE.md)
- Architecture overview: [toolforge-architecture-overview.html](https://github.com/sorensencc-dotcom/toolforge/blob/main/toolforge-architecture-overview.html)
- Governed agent dispatch: [tools/agent-dispatch/](https://github.com/sorensencc-dotcom/toolforge/tree/main/tools/agent-dispatch)
- Governance, phases, specs, and plans: [docs/meta/](https://github.com/sorensencc-dotcom/toolforge/blob/main/docs/meta/README.md)
- Documentation policy: [docs/meta/governance/documentation-policy.md](https://github.com/sorensencc-dotcom/toolforge/blob/main/docs/meta/governance/documentation-policy.md)
- Platform roadmap: [docs/meta/toolforge-platform-roadmap.md](https://github.com/sorensencc-dotcom/toolforge/blob/main/docs/meta/toolforge-platform-roadmap.md)
- CIC governance: [CIC-GOVERNANCE/README.md](https://github.com/sorensencc-dotcom/toolforge/blob/main/CIC-GOVERNANCE/README.md)
- Delivery guard: [CIC-GOVERNANCE/packages/delivery-guard/README.md](https://github.com/sorensencc-dotcom/toolforge/blob/main/CIC-GOVERNANCE/packages/delivery-guard/README.md) and its [design](https://github.com/sorensencc-dotcom/toolforge/blob/main/docs/meta/specs/2026-08-26-reusable-delivery-guard-design.md)
- Doc sync: [scripts/doc-sync/](https://github.com/sorensencc-dotcom/toolforge/tree/main/scripts/doc-sync), [wiki sync registry](https://github.com/sorensencc-dotcom/toolforge/blob/main/docs/meta/governance/wiki-sync-registry.md), and [wiki style and structure](https://github.com/sorensencc-dotcom/toolforge/blob/main/docs/meta/governance/wiki-style-and-structure.md)
- Local checkout on this machine: the `C:\dev` repo root. There is no `C:\dev\toolforge` folder.
