---
title: Home
summary: "This knowledge base indexes these products. Full writeups are not inlined yet."
tags:
  - home
---

# CIC + Rewrite Labs Knowledge Base

This knowledge base indexes these products, and the full writeups are not inlined yet. The links below are short stubs, not the product manuals.

- [Helix](products/helix/index.md)
- [Iron Ledger](products/iron-ledger/index.md)
- [Sigil](products/sigil/index.md)
- [Iron Command Forge](products/icf/index.md)
- [TRM](products/trm/index.md)
- [Toolforge](products/toolforge/index.md)
- [Toolforge Marketplace](products/toolforge-marketplace/index.md)
- [CIC Deep Research Toolkit (Cast Iron Charlie)](products/charlie-deep-research.md)
- [rewrite-mcp](products/rewrite-mcp.md)

Older pages on this site are notes from earlier work. They are not a live status board for the knowledge base.

## MAAL Sandbox System

The section below describes the MAAL Sandbox System. It is not the current production status of this site. A June 2026 status block (version, production-ready, last-updated date, and an end-to-end reproducibility claim) is left off so it is not read as current.

**Complete deterministic governance, routing, federation, and snapshot architecture for the CIC platform.**

## Overview

The MAAL Sandbox System is a fully sealed, deterministically reproducible platform consisting of **40 interconnected batches** that deliver:

- **Deterministic Access Control** — Hash-locked ACLs and permission manifests
- **Cross-Agent Federation** — Trust graphs, handoff policies, and agent registries
- **Global Snapshots** — World-state management and TorqueQuery integration
- **Full-System Sealing** — SHA256-based reproducibility certificates

Built on the CIC (Governance/Control) core, the system enables:

✅ Sealed layer hashing  
✅ Deterministic reproducibility  
✅ End-to-end verification  
✅ Cross-agent federation  
✅ Policy-driven orchestration  

---

## Key Components

| Layer | Purpose | Files |
|-------|---------|-------|
| **Access** (B36) | ACLs, permissions, bundles | 10 |
| **Federation** (B37) | Trust graphs, handoffs, agents | 11 |
| **Snapshot** (B39) | World state, corpus, TorqueQuery | 11 |
| **Final Seal** (B40) | System-wide hash, certificate | 5 |

---

## Quick Links

- [**Quickstart**](quickstart/index.md) — Get up and running in 5 minutes
- [**Architecture**](architecture/overview.md) — Deep dive into system design
- [**Batch Catalog**](batches/index.md) — All 40 batches documented
- [**API Reference**](api/overview.md) — Complete endpoint and function reference
- [**Operations**](operations/running.md) — Running, sealing, and verifying

---

## Seal commands

```bash
# Run complete seal
./final.sh

# Verify reproducibility
node final/verify.js
```

---

## Next Steps

1. **New to MAAL?** → Start with [Quickstart](quickstart/index.md)
2. **Want architecture details?** → Read [System Design](architecture/design.md)
3. **Need to operate it?** → See [Operations Guide](operations/running.md)
4. **Looking for specific batch?** → Browse [Batch Catalog](batches/index.md)

---

## Support

- **Issues**: File in project repository
- **Documentation**: Read [Troubleshooting](operations/troubleshooting.md)
- **Manifests**: See [Reference](reference/manifests.md)
