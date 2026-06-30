---
title: index
---

# Batch Catalog

Complete reference of all 40 batches in the MAAL Sandbox system.

## Overview

The system consists of 40 interconnected batches building the complete deterministic stack:

- **Batches 1-35**: Foundation & prior phases (MAAL core, governance, routing)
- **Batch 36**: Deterministic Access Layer
- **Batch 37**: Deterministic Federation Layer
- **Batch 38**: Deterministic Orchestration Layer (reserved)
- **Batch 39**: Deterministic Global Snapshot Layer
- **Batch 40**: Final Deterministic Seal

## Quick Reference

| Batch | Name | Files | Status |
|-------|------|-------|--------|
| 1-35 | Foundation & Prior | - | Sealed |
| 36 | Access Layer | 10 | ✅ Complete |
| 37 | Federation Layer | 11 | ✅ Complete |
| 38 | Orchestration Layer | - | Reserved |
| 39 | Snapshot Layer | 11 | ✅ Complete |
| 40 | Final Seal | 5 | ✅ Complete |

**Total: 38 new files created in this session**

## Batches 1-35

**Status**: Sealed (prior sessions)  
**Reference**: [Batches 1-35 Details](batches-1-35.md)

Foundation work including:
- MAAL routing engine
- Sandbox execution
- Drift detection
- Governance pipeline
- CIC ingestion
- Observability

## Batch 36: Deterministic Access Layer

**Files**: 10  
**Status**: ✅ Complete  
**Directory**: `access/`  
**Entry**: `access.sh`  
**Output**: `access-seal-report.json`

[Full Details](batch-36.md)

Components:
- ACL definitions (`access/acl/`)
- Permission mappings (`access/permissions/`)
- Access bundles (`access/bundles/`)
- Seal scripts (`access/seals/`)

## Batch 37: Deterministic Federation Layer

**Files**: 11  
**Status**: ✅ Complete  
**Directory**: `federation/`  
**Entry**: `federation.sh`  
**Output**: `federation-seal-report.json`

[Full Details](batch-37.md)

Components:
- Trust graphs (`federation/trust/`)
- Handoff policies (`federation/handoff/`)
- Agent registry (`federation/agents/`)
- Seal scripts (`federation/seals/`)

## Batch 38: Deterministic Orchestration Layer

**Status**: Reserved  
**Directory**: `orchestration/`  
**Note**: Not yet created; reserved in final manifest

Will include:
- Orchestration policies
- Deployment seals
- Runtime manifests
- Service coordination

## Batch 39: Deterministic Global Snapshot Layer

**Files**: 11  
**Status**: ✅ Complete  
**Directory**: `snapshot/`  
**Entry**: `snapshot.sh`  
**Output**: `snapshot-seal-report.json`

[Full Details](batch-39.md)

Components:
- Corpus ingestion (`snapshot/corpus/`)
- World state (`snapshot/world/`)
- TorqueQuery adapter (`snapshot/torque/`)
- Seal scripts (`snapshot/seals/`)

## Batch 40: Final Deterministic Seal

**Files**: 5  
**Status**: ✅ Complete  
**Directory**: `final/`  
**Entry**: `final.sh`  
**Output**: `final-seal-report.json`

[Full Details](batch-40.md)

Components:
- Master manifest (`final/manifest.json`)
- Recursive seal function (`final/seal.js`)
- Verification function (`final/verify.js`)
- Reproducibility certificate (`final/certificate.json`)

## Seal Execution Order

```bash
# 1. Seal access layer
./access.sh
# Output: access-seal-report.json

# 2. Seal federation layer
./federation.sh
# Output: federation-seal-report.json

# 3. Seal snapshot layer
./snapshot.sh
# Output: snapshot-seal-report.json

# 4. Final system seal (hashes all layers)
./final.sh
# Output: final-seal-report.json + final/certificate.json
```

## Master Manifest

See [BATCHES_MANIFEST.json](../../BATCHES_MANIFEST.json) for:
- All 40 batch definitions
- All 25 layer paths
- Execution order
- Reproducibility metrics

## Statistics

- **Total Batches**: 40
- **New Batches (This Session)**: 4 (36-37, 39-40)
- **New Files**: 38
- **Lines of Code**: 761
- **Seal Algorithm**: SHA256
- **Reproducibility**: Verified end-to-end
- **Version**: 1.0.0

## Next Steps

- [Batch 1-35 Details](batches-1-35.md)
- [Batch 36 (Access)](batch-36.md)
- [Batch 37 (Federation)](batch-37.md)
- [Batch 39 (Snapshot)](batch-39.md)
- [Batch 40 (Final Seal)](batch-40.md)
