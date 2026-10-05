---
title: "Iron Ledger"
summary: "Local-first financial OS. Beancount is the ledger; SQLite is a disposable projection."
tags:
  - products
  - iron-ledger
---

# Iron Ledger

Iron Ledger is a local-first financial OS for one operator. Plaintext Beancount is the accounting authority. SQLite is a disposable projection: delete it and rebuild it from the ledger. Amounts stay in integer minor units. Code under `src/ironledger` does not import Beancount. Journal checking, when you want it, is the external `bean-check` CLI from the dev extra.

Python 3.12 or newer is the host requirement, or you run the Docker stack. The README describes a React 19 operator workbench for visual staging review, rule-drift monitoring, a plain-text Beancount preview, dry-run simulation, and hash-chained meta-ledger auditing. That UI is normally at `http://127.0.0.1:8000`. If the host port is taken, `IRONLEDGER_HOST_PORT=8765 docker compose up -d` serves it at `http://127.0.0.1:8765` and maps that host port to port 8000 in the container. The Compose file sets `IRONLEDGER_JOURNAL_MODE=DELETE`, so the container runs SQLite with a rollback journal instead of WAL. WAL on the Docker Desktop bind mount corrupted `ironledger.db`, and the roadmap says not to write that file from the host while Compose is up. Outside the container, `connect()` still defaults to WAL. The workbench design spec is the layout writeup.

Safe mode is the default. It stays on when `config/safe-mode.json` is missing, corrupt, or unreadable, and it turns off only when that file sets `enabled` to false. Dry-run simulation is allowed while safe mode is on. Live compile and a projection rebuild are gated; the policy names the confirm phrases. The README project command passes `--confirm "authorize project"`.

From the repo root, with `PYTHONPATH` including `src`, you call `python -m ironledger.cli`. `project` rebuilds the projection from the ledger directory. `search` prints date, payee, account, integer minor units, and currency. `balances` reads that same ledger directory. Putting `ironledger` on `PATH` is optional.

The README also documents a zero-dependency MCP server with `search`, `balances`, and `projection_status`. Stdio is the local transport. HTTP is loopback only, with a bearer token. The dependency posture says this is standard-library JSON-RPC, not the third-party `mcp` package.

`STATUS.md` and the roadmap are where ingestion is written up: Amazon order-history CSV, Venmo statement CSV, forwarded email receipts, split proposals in the workbench, IMAP polling, and a taxonomy file. There is also an inbound email webhook, `POST /api/webhooks/inbound-email`. It takes a raw RFC 822 receipt signed in `X-IronLedger-Signature`, rejects replays, and sends a valid receipt through split proposals. It stays off, answering 503, until `IRONLEDGER_INBOUND_EMAIL_SECRET` is set. This page does not copy that milestone note.

## Where the writeups live

The full tree stays in the Iron Ledger repository. This page is only the index.

- GitHub: [sorensencc-dotcom/ironledger](https://github.com/sorensencc-dotcom/ironledger)
- Product README: [README.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/README.md)
- Milestone note: [STATUS.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/STATUS.md)
- Ingestion roadmap: [docs/meta/roadmap.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/docs/meta/roadmap.md)
- Safe mode: [docs/meta/governance/IL-GOV-SAFEMODE-001.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/docs/meta/governance/IL-GOV-SAFEMODE-001.md)
- Projection contract: [docs/meta/governance/IL-GOV-PROJECTION-001.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/docs/meta/governance/IL-GOV-PROJECTION-001.md)
- Dependency posture: [docs/meta/ironledger-dependency-posture.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/docs/meta/ironledger-dependency-posture.md)
- Workbench design: [docs/meta/specs/ironledger-phase-5-workbench-design.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/docs/meta/specs/ironledger-phase-5-workbench-design.md)
- MCP design: [docs/meta/specs/ironledger-phase-5-mcp-design.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/docs/meta/specs/ironledger-phase-5-mcp-design.md)
- Specs: [docs/meta/specs/](https://github.com/sorensencc-dotcom/ironledger/tree/main/docs/meta/specs)
- Governance: [docs/meta/governance/](https://github.com/sorensencc-dotcom/ironledger/tree/main/docs/meta/governance)
- Financial UI guidelines: [FINANCIAL-DESIGN-GUIDELINES.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/FINANCIAL-DESIGN-GUIDELINES.md) (same text at [docs/design/FINANCIAL-DESIGN-GUIDELINES.md](https://github.com/sorensencc-dotcom/ironledger/blob/main/docs/design/FINANCIAL-DESIGN-GUIDELINES.md))
- Local checkout on this machine: `C:\dev\IronLedger`
