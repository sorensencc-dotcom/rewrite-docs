---
title: "NotebookLM MCP Architecture"
summary: "Deterministic, process-isolated, operator-grade architecture specification for the NotebookLM MCP and CLI subsystem"
created: "2026-07-08"
updated: "2026-07-08"
tags:
  - reference
  - mcp
  - architecture
  - security
  - engineering
---

# NotebookLM MCP Architecture

**Status:** Proposed / Under Review  
**Date:** 2026-07-08  
**Location:** `docs/reference/notebooklm-mcp-architecture.md`  

---

## 1. Architectural Philosophy & Objectives

Programmatic access to NotebookLM has historically been locked behind web browsers and manual copy-pasting. The **NotebookLM MCP/CLI Subsystem** resolves this by exposing NotebookLM as an automated semantic retrieval substrate. 

To maintain **Six Rules compliance**, this subsystem is designed around four key principles:

```
┌──────────────────────────────────────────────────────────────┐
│                  Architectural Principles                    │
├───────────────────┬───────────────────┬──────────────────────┤
│ 1. Determinism    │ 2. Process        │ 3. Zero-Scraper      │
│    Consistent     │    Isolation      │    Direct API        │
│    answers and    │    Isolated       │    calls without     │
│    timeouts       │    credentials    │    brittle browsers  │
└───────────────────┴───────────────────┴──────────────────────┘
```

1. **Determinism**: Queries must return well-formed JSON payloads, predictable timeouts, and verifiable metadata.
2. **Process Isolation**: Sensitive Google session tokens and cookies are decoupled from the agent process, residing in a protected daemon workspace.
3. **Zero-Scraper Architecture**: Avoids brittle browser automation (Puppeteer/Playwright) by executing direct authenticated API calls via standard HTTPS protocols.

---

## 2. Component Layout & Isolation Boundary

```
  ┌────────────────────────────────────────────────────────┐
  │                   Host OS User Space                   │
  │                                                        │
  │   ┌────────────────────┐      ┌────────────────────┐   │
  │   │     CIC Agent      │      │  Outreach Agent    │   │
  │   │  (Python Runtime)  │      │  (Node.js Runtime) │   │
  │   └─────────┬──────────┘      └─────────┬──────────┘   │
  │             │                           │              │
  │             └─────────────┬─────────────┘              │
  │                           │                            │
  │                     [JSON-RPC stdio]                   │
  │                           │                            │
  │   ┌───────────────────────▼────────────────────────┐   │
  │   │             NotebookLM MCP Server              │   │
  │   │             (Stateless Daemon)                 │   │
  │   │                                                │   │
  │   │  * Establishes tool registry                   │   │
  │   │  * Enforces query timeouts                     │   │
  │   │  * Manages HTTP connections                    │   │
  │   └───────────────────────┬────────────────────────┘   │
  │                           │                            │
  │         [Authenticated HTTPS with Session Cookies]     │
  │                           │                            │
  └───────────────────────────┼────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Google NotebookLM │
                    │   Internal API    │
                    └───────────────────┘
```

### 2.1 The MCP Server Process
* **Language**: Python 3.10+
* **Interface**: Implements the Model Context Protocol (MCP) spec over `stdio` (stdin/stdout) transport channels.
* **Role**: Parses incoming JSON-RPC 2.0 messages, executes HTTP calls to NotebookLM’s backend endpoints, maps raw responses to standardized schemas, and handles error states.

### 2.2 Session Credentials Daemon
* **Auth Storage**: Cookies are stored in the user profile directory (e.g., `~/.config/notebooklm_mcp/cookies.json`) under restricted read permissions (`0600` on Unix, standard ACLs on Windows).
* **Multiple Accounts Support**: In setups where the operator has multiple active logged-in Google Accounts (e.g., corresponding to `authuser=2` URL query parameters), the session daemon must isolate and target cookies belonging specifically to that account profile index.
* **Isolation**: The calling agent (CIC or Rewrite Labs) never has direct access to read this cookie file. The agent only talks to the MCP Server process via JSON-RPC.

---

## 3. Data Schema & RPC Specifications

### 3.1 Tool Schema: `notebooklm.ask`

#### JSON-RPC Request Payload
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "notebooklm.ask",
    "arguments": {
      "notebook_id": "nb_8a2d3e4f",
      "query": "Summarize the redesign constraints for style layout.",
      "filters": {
        "max_chunks": 3
      }
    }
  },
  "id": 1
}
```

#### JSON-RPC Response Payload
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"answer\": \"The client requests slate and indigo colors...\",\n  \"chunks\": [\n    {\n      \"id\": \"ch_01\",\n      \"content\": \"Brand colors: Slate Primary, Indigo Accent.\",\n      \"source_type\": \"imported_doc\"\n    }\n  ]\n}"
      }
    ]
  },
  "id": 1
}
```

---

## 4. Error Hierarchy & Self-Healing Logic

To prevent silent failures and ensure the **Failure Mode Self-Recognition** rule is satisfied, the MCP server returns structured errors in the standard JSON-RPC format:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Session expired (NotebookLMAuthError)",
    "data": {
      "timestamp": "2026-07-08T20:15:00Z",
      "last_successful_auth": "2026-07-08T18:00:00Z"
    }
  },
  "id": 1
}
```

### Error Code Registry

| Error Code | Name | Trigger Condition | Healing Strategy |
| :--- | :--- | :--- | :--- |
| `-32001` | `NotebookLMAuthError` | HTTP 401/403 returned from NotebookLM backend. | Exit server immediately, notify operator via CLI, wait for re-authentication. |
| `-32002` | `NotebookLMTimeoutError` | NotebookLM backend request takes > 15 seconds. | Abort query, return error to client, initiate linear client-side backoff. |
| `-32003` | `NotebookLMProtocolError` | Return JSON structure differs from the defined schema. | Fail fast, log raw payload to `/data/debug/protocol-errors.log`. |

---

## 5. Security & Isolation Hardening

1. **Network Access Restriction**: The NotebookLM MCP server only has egress connectivity to `*.google.com` and `*.googleusercontent.com` domains. External webhook or analytics egress is blocked.
2. **Standard Output Hygiene**: Any diagnostic logging or stack traces must be written to `stderr`. Only valid JSON-RPC payloads are sent to `stdout` to avoid corrupting the MCP stdio communication channel.
3. **Chunk Payload Sanitization**: Chunks containing HTML or Javascript elements are sanitized to prevent script injection attacks within the context window of calling agents.

---

## See Also

* [NotebookLM Adapter Spec](../cic/notebooklm-adapter-spec.md) — Base adapter interface.
* [TorqueQuery NotebookLM Spec](../cic/torquequery-notebooklm-spec.md) — Substrate routing Spec.
* [Rewrite Labs NotebookLM Workflow](../rewrite-labs/notebooklm-workflow.md) — Redesign workflow integration.
