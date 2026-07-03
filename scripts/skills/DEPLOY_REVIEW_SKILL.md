# Deploy Review Skill

Automated verification of docker-compose stack before deployment. Checks service health, runs integration tests, verifies E2E flows, and gates based on risk assessment.

## Quick Start

```bash
# Local verification (full suite, ~90s)
./scripts/deploy-review.sh --env local

# Staging dry-run (validate config, no startup)
./scripts/deploy-review.sh --env staging --dry-run

# Production fast-track (skip long tests)
./scripts/deploy-review.sh --env prod --skip-tests
```

PowerShell:
```powershell
.\scripts\deploy-review.ps1 -Env local
.\scripts\deploy-review.ps1 -Env staging -DryRun
.\scripts\deploy-review.ps1 -Env prod -SkipTests
```

## What It Does

### Phase 1: Pre-Flight
- Validates docker-compose.yml syntax
- Checks all Dockerfiles exist and parse cleanly
- Verifies database schema mounts
- **Status:** Config validation only (safe to run anytime)

### Phase 2: Service Startup (Parallel)
- Spins up full 15-service stack via docker-compose
- Polls health endpoints on 3s interval (30s timeout per service)
- Aggregates startup times
- Captures logs if any service fails
- **Blocking:** All critical services (aperture, cic-runtime, cic-governance, unified-api) must pass health check

### Phase 3: Integration Tests (Parallel)
- Runs `npm test` in each critical service container
- Aggregates pass/fail per service
- Shows test failures (last 20 lines)
- **Blocking:** cic-runtime and cic-governance tests must pass

### Phase 4: End-to-End Flows (Sequential)
- Agent deployment: POST /api/agents/deploy
- Governance proposal: POST /api/governance/proposal
- Policy validation: POST /api/policies/validate
- **Status:** Advisory (confirms cross-service wiring)

### Phase 5: Risk Gate & Report
- Maps failures to severity (CRITICAL vs non-critical)
- Blocks deployment if any CRITICAL failure detected
- Generates JSON report (deploy-review-report.json)
- Provides rollback instructions on failure

## Output

### Console (Real-time)
```
Deploy Review Skill
Environment: local | Dry-Run: false | Skip Tests: false

[PHASE 1] Pre-Flight Validation
✓ docker-compose.yml valid
✓ All 15 services defined
✓ Found 14 Dockerfiles

[PHASE 2] Service Startup
✓ aperture healthy
✓ cic-runtime healthy
✓ cic-governance healthy
✓ unified-api healthy
✓ All critical services healthy

[PHASE 3] Integration Tests
✓ cic-runtime: tests passing
✓ cic-governance: tests passing

[PHASE 4] End-to-End Flows
✓ Agent deploy endpoint responding
✓ Governance proposal endpoint responding
✓ Policy validation endpoint responding

[PHASE 5] Risk Assessment & Gating
✓ No critical failures
✓ DEPLOYMENT APPROVED ✓

Deploy review complete in 92s
```

### Report File (deploy-review-report.json)
```json
{
  "timestamp": "2026-06-21T14:30:00Z",
  "environment": "local",
  "result": "PASS",
  "duration_seconds": 92,
  "critical_failures": [],
  "non_critical_failures": [],
  "services_verified": 15,
  "dry_run": false,
  "skip_tests": false
}
```

## Gating Rules

### Blocking (Stops Deployment)
- Any CRITICAL service fails health check
- cic-runtime or cic-governance tests fail
- Any E2E flow endpoint returns error

### Advisory (Warnings, Doesn't Block)
- Startup time > 60s (investigate slow service)
- Test duration > 30s (investigate regression)
- Non-critical service health check fails

## Options

| Flag | Description | Values | Default |
|------|-------------|--------|---------|
| `--env` | Target environment | local, staging, prod | local |
| `--dry-run` | Validate config without startup | boolean | false |
| `--skip-tests` | Skip integration test phase | boolean | false |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | PASS — All checks passed, deployment approved |
| 1 | FAIL — Critical failures detected, deployment blocked |

## Performance Baselines

| Phase | Expected Duration | Threshold Alert |
|-------|-------------------|-----------------|
| Pre-flight | 2-3s | > 5s |
| Startup | 30-45s | > 60s |
| Tests | 15-25s | > 40s |
| E2E | 5-10s | > 20s |
| **Total** | **~90s** | **> 120s** |

## Troubleshooting

### Service Failed to Start
```
✗ aperture health check failed

Troubleshoot:
docker-compose logs aperture
docker-compose exec aperture npm run build
docker-compose restart aperture
```

### Test Failures
```
✗ cic-runtime: test failures detected
--- cic-runtime test output (last 20 lines) ---
  ✓ 123 tests passing
  ✗ 1 test failing: "should handle webhook events"

Review:
docker-compose exec cic-runtime npm test -- --verbose
```

### Port Conflicts
```
If services fail to start, check port availability:
lsof -i :3117  # Check aperture port
lsof -i :3118  # Check cic-runtime port
```

### Partial Failure (Some Services OK)
Skill will auto-collect logs and display:
```
Capturing logs from failed services...
--- aperture logs (last 30 lines) ---
Error: ECONNREFUSED connecting to vault:3111
---
```

## Integration

### CI/CD Pipeline
Add to your GitHub Actions workflow:
```yaml
- name: Deploy Review
  run: ./scripts/deploy-review.sh --env staging
```

### Pre-Merge Gate
Add to `pre-commit` hook:
```bash
#!/bin/bash
if git diff --cached | grep -q docker-compose.yml; then
  ./scripts/deploy-review.sh --dry-run || exit 1
fi
```

### Pre-Deployment Approval
Manual gate before production:
```bash
./scripts/deploy-review.sh --env prod --skip-tests
# Review output & report
# If PASS: proceed to production
# If FAIL: abort and fix
```

## Rollback

If deployment verification fails:
```bash
# Stop all services
docker-compose down

# Review what went wrong
cat deploy-review-report.json | jq '.critical_failures'

# Check logs
docker-compose logs aperture  # or any service

# Fix issue, then re-run
./scripts/deploy-review.sh --env local
```

## Extending the Skill

### Add Custom E2E Flow
Edit Phase 4 in deploy-review.sh:
```bash
# E2E N: My Custom Flow
echo "Testing my custom flow..."
if curl -sf -X POST http://localhost:3119/api/custom \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' > /dev/null 2>&1; then
  log_pass "Custom flow endpoint responding"
else
  log_fail "Custom flow failed"
  CRITICAL_FAILURES+=("e2e custom-flow")
fi
```

### Add Custom Metrics Tracking
Edit phase_startup() or phase_tests():
```bash
# Track startup time per service
START=$(date +%s%N)
docker-compose up -d
END=$(date +%s%N)
STARTUP_TIME=$((($END - $START) / 1000000))
echo "Startup time: ${STARTUP_TIME}ms" >> metrics.log
```

### Add Health Check for New Service
Edit ServicePorts map in phase_startup():
```bash
declare -A SERVICE_PORTS=(
  [my-new-service]=3199  # Add this line
  [aperture]=3117
  # ... rest of services
)
```

## FAQ

**Q: Why does startup take 45 seconds?**
A: Docker needs time to pull images, init databases, run migrations. Use `--dry-run` to verify config without startup.

**Q: Can I run this against a remote docker-compose?**
A: Currently expects local docker socket. Extend by adding `--docker-host` flag.

**Q: What if one service is flaky?**
A: Increase `TIMEOUT_HEALTH` at top of script (default 30s) or `--skip-tests` to reduce test phase flakiness.

**Q: Can I integrate with Slack/Email notifications?**
A: Add after phase_risk_gate():
```bash
if [ "$result" = "PASS" ]; then
  curl -X POST $SLACK_WEBHOOK -d "Deployment approved"
fi
```

## Version

Version: 1.0.0  
Author: [claude]  
Last Updated: 2026-06-21
