---
title: "Sigil"
summary: "Signed task relay, host connector, and shared agent rooms for Antigravity, Claude, Codex, xAI Grok, and local models."
tags:
  - products
  - sigil
---

# Sigil

Sigil is the local connector and relay that lets agent hosts hand each other signed tasks. A connector keeps the endpoint identity, canonicalizes the envelope with RFC 8785 JSON, and signs it with Ed25519. The relay checks that signature before it will treat the message as a durable, idempotent delivery. When you run the durable relay, PostgreSQL stores delivery, approval, and processing state. The wiki also describes an in-memory relay for local development. The hosts on the other side of the connector are Antigravity, Claude, Codex, xAI Grok, and sovereign local models such as Ollama and vLLM. The architecture guide adds llama.cpp on that same local path.

This is not Cast Iron Charlie interface chrome. People drive it with the `sigil` command (`init`, `relay up`, `agent run`, `send`, `inbox`, `mcp`) or with the MCP stdio bridge. The bridge exposes `sigil_send_task`, `sigil_check_inbox`, `sigil_get_result`, `sigil_ack_delivery`, `sigil_request_approval`, and `sigil_resolve_context`. Each of those needs the same capability in both the package permissions and the connector grants. An endpoint token is not a human approval. High-risk delivery needs an approved action hash, and the wiki walks through the WebAuthn ceremony at `/approve`. AgentMail can be turned on as an ingress for three configured inboxes. It stays a transport. Sigil stays the authority for identity, grants, routing, approval, and audit.

Sigil also has rooms now. The first three phases of the rooms work merged to `main` between October 2 and October 5, 2026. A room is a shared conversation between you and your agent endpoints. The relay gives every room message a gapless `room_seq`, fans it out to members, and serves history and invocations under `/v1/rooms`. Claude and Codex join through `sigil agent run --room-bridge claude` or `--room-bridge codex`, and each keeps its own CLI session per room. An @mention invokes an agent, and agents only receive the messages that invoke them. Agent-to-agent chat is capped by a hop budget (six agent turns per thread after the last human message, by default), one running invocation per agent per room, and a Stop route any human member can use to kill the running CLI.

When a human posts without mentioning anyone, a router can pick who answers. You run it with `sigil agent run --room-bridge router`. It asks a local Ollama model (`qwen2.5:7b` unless you set `--router-model`) and posts its pick back to the relay. The relay re-checks every pick against the roster, so the router's answer is advisory and grants no capabilities. Routing decisions, refusals, router failures, and Stops show up in room history as `room.event` messages. A dedicated relay system identity signs them, passed with `sigil relay up --room-system-identity`. Without that identity, rooms emit no events and the router gets nothing to route. The web client is the next phase and isn't built, so for now you read a room through the inbox or history routes.

The README describes the repository as active v1 protocol conformance. Prerequisites, the compatibility matrix, and the verification notes live in that README, not here. The README doesn't cover rooms yet. The rooms design docs linked below do. Stream sequencing is a separate session-layer feature and it is off unless enabled. The page for that is linked below.

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
- Rooms design: [docs/superpowers/specs/2026-10-02-sigil-rooms-design.md](https://github.com/sorensencc-dotcom/sigil/blob/main/docs/superpowers/specs/2026-10-02-sigil-rooms-design.md)
- Rooms router design: [docs/superpowers/specs/2026-10-04-sigil-rooms-phase-3-router-design.md](https://github.com/sorensencc-dotcom/sigil/blob/main/docs/superpowers/specs/2026-10-04-sigil-rooms-phase-3-router-design.md)
- Local checkout on this machine: `C:\dev\sigil-repo`. There is no `C:\dev\sigil`.

A machine that does not need a clone can install with `npm install --global github:sorensencc-dotcom/sigil`. The getting-started guide also names the package `@sorensencc/sigil`.
