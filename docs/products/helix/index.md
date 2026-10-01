---
title: "Helix"
summary: "Local Windows daemon that orchestrates governed engineering work across ICF, WhichLLM, and Sigil."
tags:
  - products
  - helix
---

# Helix

Helix is a local Windows personal-assistant foundation for governed engineering work. It runs as a daemon on one machine. An authenticated operator request gets a stable session and a correlation identity. Helix then retrieves governed context, asks WhichLLM for an approved model, produces a response, persists ordinary-session results, and records audit events. Governed work fails closed when its authority or evidence boundary is unavailable.

Helix does not own the neighboring systems. ICF owns knowledge, retrieval, context, lineage, evidence, and governance. WhichLLM owns model selection, provider classification, and routing policy. Sigil owns capabilities, approvals, execution, and environment interaction. Windows IIS/HTTP.sys and the native principal bridge establish the authenticated operator identity. Helix owns the session lifecycle, the correlation identity, the local persistence boundary, and the orchestration between those authorities.

Every accepted request carries a Helix-owned identity envelope. The immutable caller anchor is the Windows SID. Authority receipts have to match the request correlation ID and that SID. Clients, headers, and adapters cannot replace the authenticated identity. The native bridge terminates Negotiate SSPI on loopback and is the only authenticator. Ordinary conversations stay in encrypted local storage. Governed content stays in RAM unless the operator explicitly exports or pins it. The project specification keeps the Windows identity, the ICF identity, and the Sigil identity distinct inside that same envelope.

Response generation uses the local model WhichLLM selected, through Ollama's loopback `POST http://127.0.0.1:11434/api/chat`. Helix sends `stream: false`, the selected model, the operator prompt, and the retrieved context. HTTP failures, timeouts, malformed JSON, or a missing `message.content` fail closed. Helix does not substitute another model and does not turn on cloud routing by itself. Cloud use stays off unless the operator explicitly enables it for a request or session, and governed content never goes to a cloud provider. The daemon binds to loopback by default. Configuration and daemon construction both reject a non-loopback bind.

The HTTP API is the canonical client contract. The CLI and the browser use those same endpoints. The browser is a local operator console: conversation first, model and scope second, trust and audit details third. It does not call ICF, WhichLLM, Sigil, the Windows bridge, or a model endpoint on its own. Approved adapter locations are environment variables, not credentials stored in the repository: `HELIX_ICF_RESOLVE_URL`, `HELIX_SIGIL_EXECUTE_URL`, and `HELIX_WHICHLLM_URL`.

The README describes Phase 8 foundation work on `main`: strict runtime contracts, SQLite restart recovery, daemon lifecycle routes, SSE replay, native Windows bridge scaffolding, adapter transport and receipt binding, endpoint configuration labels, and packaging validation. External adapter activation stays fail-closed until approved endpoint, authentication, response, receipt, and deployment evidence is available. The MSIX manifest stays explicitly unsigned until a publisher identity and a signing certificate are supplied. Local tests and unsigned package validation are development evidence. They are not production approval, signed-release evidence, or clean-machine installation evidence. The local commands the README names are `npm install`, `npm run check`, and `npm run package:validate`.

## Where the writeups live

The full tree stays in the Helix repository. This page is only the index. GitHub's default branch is `main`.

- GitHub: [sorensencc-dotcom/helix](https://github.com/sorensencc-dotcom/helix)
- Product README: [README.md](https://github.com/sorensencc-dotcom/helix/blob/main/README.md)
- Architecture diagram: [docs/diagrams/helix-architecture.html](https://github.com/sorensencc-dotcom/helix/blob/main/docs/diagrams/helix-architecture.html)
- Project specification: [docs/superpowers/specs/2026-09-10-helix-project-spec.md](https://github.com/sorensencc-dotcom/helix/blob/main/docs/superpowers/specs/2026-09-10-helix-project-spec.md)
- Unified foundation design: [docs/superpowers/specs/2026-09-10-helix-unified-foundation-design.md](https://github.com/sorensencc-dotcom/helix/blob/main/docs/superpowers/specs/2026-09-10-helix-unified-foundation-design.md)
- Phase 8 release-readiness design: [docs/superpowers/specs/2026-09-10-helix-phase-8-integration-release-readiness-design.md](https://github.com/sorensencc-dotcom/helix/blob/main/docs/superpowers/specs/2026-09-10-helix-phase-8-integration-release-readiness-design.md)
- Local operator UI: [docs/superpowers/specs/2026-09-12-helix-local-operator-ui-spec.md](https://github.com/sorensencc-dotcom/helix/blob/main/docs/superpowers/specs/2026-09-12-helix-local-operator-ui-spec.md)
- Contracts index: [docs/contracts/README.md](https://github.com/sorensencc-dotcom/helix/blob/main/docs/contracts/README.md)
- Local authority scope: [docs/contracts/helix-phase-8-local-authority-scope.md](https://github.com/sorensencc-dotcom/helix/blob/main/docs/contracts/helix-phase-8-local-authority-scope.md)
- Windows principal bridge: [native/windows-bridge/README.md](https://github.com/sorensencc-dotcom/helix/blob/main/native/windows-bridge/README.md)
- Packaging: [packaging/README.md](https://github.com/sorensencc-dotcom/helix/blob/main/packaging/README.md)
- Phase 8 implementation plan: [docs/superpowers/plans/2026-09-10-helix-phase-8-implementation-plan.md](https://github.com/sorensencc-dotcom/helix/blob/main/docs/superpowers/plans/2026-09-10-helix-phase-8-implementation-plan.md)
- Local checkout on this machine: `C:\dev\helix`
