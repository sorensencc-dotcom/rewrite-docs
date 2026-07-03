# CIC Documentation Index

Complete reference for CIC (Computational Intelligence Core) phases, components, and implementation.

## Phases

### Foundation (1–4)

- [Phase 1: MAAL Core](PHASE-1_OVERVIEW.md)
  - [Architecture](PHASE-1_ARCHITECTURE.md)
  - [File Contract](PHASE-1_FILE_CONTRACT.md)
  - [Implementation Order](PHASE-1_IMPLEMENTATION_ORDER.md)
  - [Ledger Substrate](PHASE-1_LEDGER_SUBSTRATE.md)
  - [Bridge Orchestrator](PHASE-1_BRIDGE_ORCHESTRATOR.md)
  - [Testing](PHASE-1_TESTING.md)

- [Phase 2: SPL/RL Foundation](PHASE-2_OVERVIEW.md)
  - [Architecture](PHASE-2_ARCHITECTURE.md)
  - [State Space](PHASE-2_STATE_SPACE.md)
  - [Action Space](PHASE-2_ACTION_SPACE.md)
  - [Reward Function](PHASE-2_REWARD_FUNCTION.md)
  - [Policy Learner](PHASE-2_POLICY_LEARNER.md)
  - [Simulation Engine](PHASE-2_SIMULATION_ENGINE.md)
  - [Training Loop](PHASE-2_TRAINING_LOOP.md)
  - [Episode Trajectory](PHASE-2_EPISODE_TRAJECTORY.md)
  - [Integration](PHASE-2_INTEGRATION.md)
  - [Testing](PHASE-2_TESTING.md)

- [Phase 3: SPL Integration](PHASE-3-COMPLETION-LOG.md)

- [Phase 4: Canary Gates](PHASE4-SPEC-LOCKED.md)

### Core Components (5–8)

- [Phase 5: TorqueQuery](TORQUEQUERY_EXECUTIVE_SUMMARY.md)
  - [Build Summary](TORQUEQUERY_BUILD_SUMMARY.md)
  - [Quickstart](TORQUEQUERY_QUICKSTART.md)
  - [MCP Reference](TORQUEQUERY_MCP_REFERENCE.md)
  - [Index](TORQUEQUERY_INDEX.md)

- Phase 6: [Implementation Summary](PHASE6-IMPLEMENTATION-SUMMARY.md)

- Phase 8: [Spec](PHASE_8_SPEC.md) | [Test Matrices](PHASE_8_TEST_MATRICES.md)

### Optimization & Hardening (A–C)

- [Phase A: Optimization](PHASE_A_OPTIMIZATION_SUMMARY.md)
- [Phase B: Hardening](PHASE_B_HARDENING_SUMMARY.md)
- [Phase C: Integration](PHASE_C_INTEGRATION_SUMMARY.md)

### Advanced Phases (23–30)

- [Phase 23](PHASE-23-6-MEMORY-EXPLORER-UI.md)
- [Phase 26: Implementation](../implementation/phase-26/summary.md)
- [Phase 27.3](PHASE27_3_EXECUTION_PLAN.md) | [Phase 27.4](PHASE_27_4_DISPATCH.md)
- [Phase 28a: SCP Completion](PHASE-28a-SCP-COMPLETION.md)
- [Phase 30: MVP Spec](PHASE-30-MVP-SPEC.md)

## Core Subsystems

### Governance & Memory

- [Governance Framework](GOVERNANCE.md)
- [Memory System](MEMORY_V1_STAGING_ACTIVATION.md)
- [Knowledge Integration](KB_INTEGRATION_SUMMARY.md)

### Data Pipeline

- [CodeFlow Harvester](harvester.md)
- [Drift Engine](driftEngine.md)
- [Replay Harness](replayHarness.md)

### Observability & Determinism

- [Runtime Observability Plan](CIC_RUNTIME_OBSERVABILITY_PLAN.md)
- [Prometheus Integration](PROMETHEUS_INTEGRATION_STATUS.md)
- [Sandbox-3 Overview](SANDBOX-3_OVERVIEW.md)
  - [Architecture](SANDBOX-3_ARCHITECTURE.md)
  - [Kubernetes](SANDBOX-3_K8S.md)
  - [Determinism](SANDBOX-3_DETERMINISM.md)
  - [Routing v3](SANDBOX-3_ROUTING_V3.md)
  - [Stability v3](SANDBOX-3_STABILITY_V3.md)
  - [Monitoring](SANDBOX-3_MONITORING.md)
  - [Incident Response](SANDBOX-3_INCIDENT_RESPONSE.md)

### Token & Cost

- [Token Audit Report](TOKEN_AUDIT_REPORT.md)
- [Token Coverage Matrix](TOKEN_COVERAGE_MATRIX.md)
- [Phase Roadmap](TOKEN_COVERAGE_MATRIX_PHASE_ROADMAP.md)
- [CIC Token Pack v2.0](CIC_TOKEN_PACK_v2_0_FULL_LIST.md)

### Deployment & Operations

- [Canary Gates](CANARY_GATES.md)
- [Phase A Deployment](CANARY_PHASE_A_DEPLOYMENT.md)
- [Phase A Prod Deployment Checklist](CANARY_PHASE_A_PROD_DEPLOYMENT_CHECKLIST.md)
- [Phase 5 Canary Rollout Plan](PHASE_5_CANARY_ROLLOUT_PLAN.md)

## Research & Testing

- [Research Skill Overview](research-skill/SKILL.md)
- [Test Results - Iteration 1](research-skill/test-results/iteration-1-grading.md)
- [Test Results - Iteration 2](research-skill/test-results/iteration-2-grading.md)

## Status Reports

- [Execution Status](EXECUTION-STATUS.md)
- [P1 Implementation Complete](P1_IMPLEMENTATION_COMPLETE.md)
- [Phase 2 Status](PHASE_2_STATUS.md)
- [Sandbox-3 Progress](SANDBOX-3-PROGRESS.md)

## Execution Logs

- [Phase 1 Execution Log](PHASE-1-EXECUTION-LOG.md)
- [Phase 2 Completion Log](PHASE-2-COMPLETION-LOG.md)
- [Phase 3 Completion Log](PHASE-3-COMPLETION-LOG.md)

## Quick Navigation

- **Getting Started**: [Phase 1 Overview](PHASE-1_OVERVIEW.md)
- **Architecture**: [Architecture Overview](../architecture/overview.md)
- **API Reference**: [API Overview](../api/overview.md)
- **Operations**: [Running the System](../operations/running.md)
- **Cross-System**: [CIC ↔ RL Integration](../reference/cic-rl-cross-reference.md)
