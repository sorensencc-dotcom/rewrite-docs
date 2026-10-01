---
title: "Sigil"
summary: "Signed task relay and host connector for Antigravity, Claude, Codex, xAI Grok, and local models."
tags:
  - products
  - sigil
---

# Sigil

Sigil is the local connector and relay that lets agent hosts hand each other signed tasks. A connector keeps the endpoint identity, canonicalizes the envelope with RFC 8785 JSON, and signs it with Ed25519. The relay checks that signature before it will treat the message as a durable, idempotent delivery. When you run the durable relay, PostgreSQL stores delivery, approval, and processing state. The wiki also describes an in-memory relay for local development. The hosts on the other side of the connector are Antigravity, Claude, Codex, xAI Grok, and sovereign local models such as Ollama and vLLM. The architecture guide adds llama.cpp on that same local path.

This is not Cast Iron Charlie interface chrome. People drive it with the `sigil` command (`init`, `relay up`, `agent run`, `send`, `inbox`, `mcp`) or with the MCP stdio bridge. The bridge exposes `sigil_send_task`, `sigil_check_inbox`, `sigil_get_result`, `sigil_ack_delivery`, `sigil_request_approval`, and `sigil_resolve_context`. Each of those needs the same capability in both the package permissions and the connector grants. An endpoint token is not a human approval. High-risk delivery needs an approved action hash, and the wiki walks through the WebAuthn ceremony at `/approve`. AgentMail can be turned on as an ingress for three configured inboxes. It stays a transport. Sigil stays the authority for identity, grants, routing, approval, and audit.

The README describes the repository as active v1 protocol conformance. Prerequisites, the compatibility matrix, and the verification notes live in that README, not here. Stream sequencing is a separate session-layer feature and it is off unless enabled. The page for that is linked below.

## Where the writeups live

The full tree stays in the Sigil repository. This page is only the index.

- GitHub: [sorensencc-dotcom/sigil](https://github.com/sorensencc-dotcom/sigil)
- Product README: [README.md](https://github.com/sorensencc-dotcom/sigil/blob/main/README.md)
- Install and host registration: [docs/getting-started.md](https://github.com/sorensencc-dotcom/sigil/blob/main/docs/getting-started.md)
- Architecture, delivery lifecycle, and MCP: [docs/wiki/README.md](https://github.com/sorensencc-dotcom/sigil/blob/main/docs/wiki/README.md)
- Session-layer sequencing: [docs/wiki/Session-Layer-Protocol.md](https://github.com/sorensencc-dotcom/sigil/blob/main/docs/wiki/Session-Layer-Protocol.md)
- xAI Grok adapter: [docs/wiki/Grokbot-Adapter.md](https://github.com/sorensencc-dotcom/sigil/blob/main/docs/wiki/Grokbot-Adapter.md)
- Protocol, auth, and implementation specs: [docs/specs/](https://github.com/sorensencc-dotcom/sigil/tree/main/docs/specs)
- AgentMail ingress: [docs/agentmail-ingress.md](https://github.com/sorensencc-dotcom/sigil/blob/main/docs/agentmail-ingress.md)
- Local checkout on this machine: `C:\dev\sigil-repo`. There is no `C:\dev\sigil`.

A machine that does not need a clone can install with `npm install --global github:sorensencc-dotcom/sigil`. The getting-started guide also names the package `@sorensencc/sigil`.
