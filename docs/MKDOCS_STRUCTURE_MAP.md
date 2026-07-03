# MkDocs Structure Map — Documentation Organization

**Last updated:** 2026-07-01  
**Purpose:** Single source of truth for where to place each type of documentation.

---

## Current Navigation Structure

```yaml
Home
├── Getting Started
│   ├── Quickstart
│   ├── Installation
│   └── First Steps
├── Architecture
│   ├── Overview
│   ├── System Design
│   ├── Deterministic Stack
│   ├── Data Flow
│   ├── Local-First Routing
│   ├── Drift Classification
│   └── Ingestion & Trace
├── Gateway
│   ├── API & State Store
│   └── Providers Configuration
├── CIC Subsystems
│   ├── CodeFlow Harvester
│   ├── Drift Engine
│   └── Replay Harness
├── Dashboard
│   └── Operator Dashboard
├── Test Matrices
│   ├── Routing Tests
│   ├── Feedback Loop Tests
│   └── Dashboard Tests
├── Batches
│   ├── Batch Catalog
│   ├── Batches 1-35
│   ├── Batch 36 (Access)
│   ├── Batch 37 (Federation)
│   ├── Batch 39 (Snapshot)
│   └── Batch 40 (Final Seal)
├── API Reference
│   ├── Overview
│   ├── Access Layer
│   ├── Federation Layer
│   ├── Snapshot Layer
│   └── Seal & Verify
├── Operations
│   ├── Running the System
│   ├── Sealing Layers
│   ├── Verification
│   ├── Monitoring
│   └── Troubleshooting
└── Reference
    ├── Manifests
    ├── Schemas
    ├── Environment
    └── CLI Commands
```

---

## Documentation Type → Folder Mapping

### **Getting Started** (`docs/quickstart/`)
**Purpose:** Onboarding + first-use guides  
**Audience:** New users, operators

**Belongs here:**
- Installation instructions
- "hello world" examples
- 5-minute quick starts
- Prerequisites

**Examples:**
```
docs/quickstart/installation.md
docs/quickstart/first-steps.md
docs/quickstart/setup-local-dev.md
```

---

### **Architecture** (`docs/architecture/`)
**Purpose:** System design + conceptual understanding  
**Audience:** Architects, senior engineers

**Belongs here:**
- System design decisions
- Data flow diagrams
- Design principles
- Component interactions
- Deterministic guarantees
- Sealed routing explanations

**Examples:**
```
docs/architecture/overview.md          (high-level system)
docs/architecture/deterministic-stack.md (why things are deterministic)
docs/architecture/routing.md           (how routing works)
docs/architecture/drift.md             (drift classification)
```

---

### **Gateway** (`docs/gateway/`)
**Purpose:** Gateway API + provider configuration  
**Audience:** Integration engineers

**Belongs here:**
- Gateway API endpoints
- Provider setup & configuration
- Authentication methods
- Model specifications

**Examples:**
```
docs/gateway/adapterGatewayAPI.md
docs/gateway/providers.md
```

**NEW: Cloud Extension Providers**
```
docs/implementation/cloud-extension-layer.md ← (not here — belongs in Implementation)
```

---

### **CIC Subsystems** (`docs/cic/`)
**Purpose:** CIC component deep-dives  
**Audience:** CIC maintainers, engineers

**Belongs here:**
- CodeFlow harvester details
- Drift engine algorithm
- Replay harness internals
- State store design

**Examples:**
```
docs/cic/harvester.md
docs/cic/driftEngine.md
docs/cic/replayHarness.md
```

---

### **Dashboard** (`docs/dashboard/`)
**Purpose:** UI/Dashboard operator guides  
**Audience:** Operators, dashboard users

**Belongs here:**
- Dashboard UI walkthrough
- Drift panel interpretation
- Monitoring via dashboard
- Alert configuration

**Examples:**
```
docs/dashboard/dashboard.md
```

---

### **Test Matrices** (`docs/tests/`)
**Purpose:** Test coverage + verification matrices  
**Audience:** QA, test engineers

**Belongs here:**
- Test matrices (routing, feedback loop, dashboard)
- Coverage reports
- Test verification steps

**Examples:**
```
docs/tests/routing-tests.md
docs/tests/feedback-loop-tests.md
docs/tests/dashboard-tests.md
```

---

### **Batches** (`docs/batches/`)
**Purpose:** Batch architecture (Batches 1–40)  
**Audience:** Architects, compliance teams

**Belongs here:**
- Batch specifications
- Batch-level contracts
- Completion reports

**Examples:**
```
docs/batches/batches-1-35.md
docs/batches/batch-36.md
docs/batches/batch-37.md
```

---

### **API Reference** (`docs/api/`)
**Purpose:** Formal API specifications  
**Audience:** Integration engineers, API consumers

**Belongs here:**
- API endpoint specs
- Request/response schemas
- Authentication details
- Error codes

**Examples:**
```
docs/api/overview.md
docs/api/access-layer.md
docs/api/federation-layer.md
```

---

### **Operations** (`docs/operations/`)
**Purpose:** Running, monitoring, troubleshooting  
**Audience:** Operators, on-call engineers

**Belongs here:**
- How to run the system
- Sealing procedures
- Verification runbooks
- Monitoring setup
- Troubleshooting guides

**Examples:**
```
docs/operations/running.md
docs/operations/monitoring.md
docs/operations/troubleshooting.md
```

---

### **Reference** (`docs/reference/`)
**Purpose:** Lookup tables, schemas, environment  
**Audience:** All users (lookup)

**Belongs here:**
- Manifest files
- Database schemas
- Environment variables
- CLI command reference

**Examples:**
```
docs/reference/manifests.md
docs/reference/schemas.md
docs/reference/environment.md
```

---

### **Implementation** (`docs/implementation/`) ⭐ **NEW**
**Purpose:** Feature implementation guides + integration instructions  
**Audience:** Feature engineers, implementers

**Belongs here:**
- Implementation plans
- Integration guides
- Feature-level technical specs
- Implementation checklists
- Developer workflows

**Examples:**
```
docs/implementation/cloud-extension-layer.md     (NEW)
docs/implementation/drift-engine-setup.md        (future)
docs/implementation/provider-integration.md      (future)
```

---

## Decision Tree: Where Does My Doc Belong?

```
Is it a setup/first-use guide?
  YES → docs/quickstart/
  
Is it explaining WHY the system works a certain way?
  YES → docs/architecture/
  
Is it about a specific CIC component (harvester/drift/replay)?
  YES → docs/cic/
  
Is it about gateway API or providers?
  YES → docs/gateway/
  
Is it about implementing a feature or integrating a subsystem?
  YES → docs/implementation/ ← NEW
  
Is it about running/monitoring/troubleshooting?
  YES → docs/operations/
  
Is it an API specification?
  YES → docs/api/
  
Is it a lookup table (schemas, env vars, CLI)?
  YES → docs/reference/
  
Is it about batch architecture?
  YES → docs/batches/
  
Is it about tests/verification?
  YES → docs/tests/
  
Is it about the dashboard UI?
  YES → docs/dashboard/
  
If none above: Create new folder under docs/ with clear purpose
```

---

## Recent Additions

### Implementation Folder
**Created:** 2026-07-01  
**Purpose:** Home for implementation guides, feature integration specs, technical implementation instructions

**First content:**
- `cloud-extension-layer.md` — Cloud provider integration guide + checklist

**Future content:**
- Provider onboarding templates
- Feature integration walkthroughs
- Technical implementation specs
- Subsystem integration guides

---

## File Naming Conventions

### By Folder Type

**Quickstart:**
- `installation.md`, `first-steps.md`, `setup-*.md`

**Architecture:**
- `overview.md`, `design.md`, `*-stack.md`, `*-routing.md`

**Gateway:**
- `*.md` (API-specific or provider-specific)

**CIC:**
- `*Engine.md`, `*Harvester.md`, `*Harness.md`

**Implementation:**
- `*-integration.md`, `*-setup.md`, `*-implementation.md`, `*-checklist.md`

**Operations:**
- `running.md`, `*-setup.md`, `troubleshooting.md`, `monitoring.md`

**API:**
- `*-layer.md`, `overview.md`, `*-endpoints.md`

**Reference:**
- `*.md` (generic lookup)

**Batches:**
- `batch-*.md`, `batches-*.md`

---

## MkDocs Configuration

Current `mkdocs.yml` nav structure (last updated 2026-07-01):
- 11 top-level sections
- 40+ individual pages
- Material theme with tabbed navigation

### To Add New Section

Edit `mkdocs.yml`:
```yaml
nav:
  - Home: index.md
  - Getting Started: ...
  - ... (existing)
  - Implementation:           # NEW SECTION
      - Cloud Extension: implementation/cloud-extension-layer.md
      - Other Guides: implementation/other-guide.md
  - Operations: ...
  - ... (rest)
```

---

## Audit: Which Docs Belong Where?

| Document | Current | Correct | Status |
|----------|---------|---------|--------|
| Cloud Extension Implementation Summary | Root (❌) | `docs/implementation/` (✓) | MOVED |
| CIC MAAL Audit | Root (❌) | `docs/architecture/` or `docs/reference/` | REVIEW |
| BUILD-SUMMARY | Root (❌) | `docs/reference/` or `docs/operations/` | REVIEW |
| DOCKER quickstart | Root (❌) | `docs/quickstart/` | REVIEW |
| Governance Playbook | ? | `docs/operations/` or `docs/reference/` | REVIEW |

---

**Next step:** Run full audit on root `.md` files and relocate to correct folders per this map.
