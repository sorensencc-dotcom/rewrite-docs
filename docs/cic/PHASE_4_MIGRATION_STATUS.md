# Phase 4 SQL Schema Migration

**Date:** 2026-06-27  
**Status:** ✅ MIGRATION SCRIPTS READY  
**Version:** v0.4.0-maal-codesign-canary-foundation

---

## Migration Approach

**Development:** Docker container initialization (append SQL to docker-entrypoint-initdb.d)  
**Production:** Use Liquibase or declarative SQL versioning (TODO: implement migration framework)

---

## Schema Summary

| Table | Type | Purpose | Indexes |
|-------|------|---------|---------|
| `regime_proposals` | Append-only | Regime parameter changes | proposal_id, submitted_at, validation_result |
| `constraint_proposals` | Append-only | Safety/performance constraint updates | proposal_id |
| `fallback_graph_proposals` | Append-only | Fallback route graph edges | proposal_id |
| `reward_adjustment_proposals` | Append-only | Reward function adjustments | proposal_id |
| `simulator_drift_reports` | Append-only | Simulator calibration changes | proposal_id |
| `governance_approvals` | Append-only | Approval decisions + TTL tracking | proposal_id, decision_type, expires_at, is_expired |
| `canary_gate_results` | Append-only | Telemetry + metric violations | proposal_id, decision, cohort_step |
| `canary_growth_configs` | Append-only | Canary growth state (read-before-step) | proposal_id, status |

---

## Migration Script Location

**Development:** `docker-init-phase4.sql`  
**Loaded via:** docker-compose.yml volumes → `/docker-entrypoint-initdb.d/003-phase4-schemas.sql`  
**Trigger:** Postgres container initialization (if tables don't exist)

---

## Key Properties

✅ **Immutability:** All tables designed as append-only (no UPDATE/DELETE)  
✅ **Foreign Keys:** All proposal-related tables reference `regime_proposals.proposal_id`  
✅ **Indexes:** Query acceleration on common lookups (proposal_id, decision, status)  
✅ **Defaults:** Timestamps auto-populated; governance_tier and requires_canary pre-set  

---

## Next Steps

1. **Local Development:** `docker-compose up postgres` will auto-initialize Phase 4 tables
2. **Production Deployment:** Use migration framework (Liquibase, Alembic, or custom versioning)
3. **Verification:** Connect to postgres, run `\dt` to list Phase 4 tables
4. **Data Validation:** Insert test proposals and verify append-only constraint

---

## Connection Details

**Host:** localhost  
**Port:** 5433 (mapped from 5432 inside container)  
**Database:** cic_lineage  
**User:** cic  
**Password:** cic_dev_pass (dev/test only; use secrets in production)

---

**Next:** Implement hook handlers (CanaryGateOrchestrator, governance review logic)
