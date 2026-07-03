---
title: "GOVERNANCE"
summary: "# CIC Governance Layer"
created: "2026-07-03T19:43:45.373Z"
updated: "2026-07-03T19:43:45.373Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC Governance Layer

Adds **policy enforcement**, **approval gates**, and **drift detection** to the Update-Monitor loop.

---

## Three Layers

### 1. Policy Engine

**File:** `policy-manifest.yaml`

Turns impact tags into enforceable rules:

```yaml
repos:
  codeflow:
    - match: "mandatory_update.security"
      adoption: "must-adopt"      # Required adoption
      blocking: true              # Blocks release if not active
      deadline: "before-next-release"
      reason: "Security vulnerabilities must be patched immediately"
```

**Adoption levels:**
- `must-adopt` — operator must resolve before release
- `optional` — nice-to-have, no deadline

**Blocking semantics:**
- `blocking: true` → release CI fails if not active
- `blocking: false` → doesn't block release

**Global overrides:**
```yaml
global_rules:
  - match: ".*security.*"
    adoption: "must-adopt"
    blocking: true
```

Security issues always override everything.

---

### 2. Approval Gates (State Machine)

**States:**
```
candidate → approve → approved → activate → active
         ↓
         reject → rejected (terminal)
```

**Commands:**

```bash
# Approve candidate (prepares for activation)
cic roadmap approve <itemId>

# Reject candidate (won't be adopted)
cic roadmap reject <itemId> --reason "Not compatible"

# Activate approved item (apply changes to CIC)
cic roadmap activate <itemId>
```

**State meanings:**
- **candidate:** Update Monitor just created it; waiting for operator review
- **approved:** Operator reviewed; waiting for activation
- **active:** Changes applied to CIC (extractor updated, Docker deployed)
- **rejected:** Operator declined; no changes made

**Transitions:**
- Only candidates can be approved/rejected
- Only approved items can be activated
- Active items can revert to candidate for rollback

---

### 3. Drift Detection

**Goal:** Detect when CIC's internal state lags behind CodeFlow's latest analysis.

**Drift types:**
- Missing edges (dependency graph gaps)
- Missing security findings (detection lag)
- Missing patterns (pattern detector divergence)
- Missing impact analysis (blast-radius gaps)

**Check drift:**

```bash
cic roadmap drift codeflow

# Output:
# Status: DRIFTING
# Severity: CRITICAL
#
# Coverage:
#   Edges:    85% (102/120)
#   Security: 90% (9/10)  ← Missing 1 security issue!
#   Patterns: 95% (19/20)
#
# ⚠️  Missing Security Findings (1):
#     src/config.js:42 — hardcoded_secret [critical]
```

**Severity levels:**
- **critical** — security findings missing
- **high** — both edges & patterns missing
- **medium** — edges or patterns missing
- **low** — minor gaps
- **none** — in sync

**Action:** Drift at severity `high`+ automatically creates a `must-adopt` roadmap item:

```
[DRIFT] CIC behind CodeFlow for codeflow
  Type: todo
  Priority: high
  Policy: must-adopt
  Blocking: true
  Reason: Missing 1 security issue, 3 patterns, 18 edges
```

---

## Integration Flow

```
1. Update Monitor detects CodeFlow change
         ↓
2. Classify impact tag: mandatory_update.security
         ↓
3. Policy Engine evaluates:
   - Repo rule: match "mandatory_update.security" → must-adopt, blocking
   - Global rule: match ".*security.*" → must-adopt, blocking (overrides)
   - Result: adoption="must-adopt", blocking=true, deadline="before-next-release"
         ↓
4. Create roadmap item with policy:
   - state: candidate (waiting for approval)
   - policy: must-adopt
   - blocking: true
   - deadline: before-next-release
         ↓
5. Operator decision:
   Option A: cic roadmap approve <itemId>
            → state: approved (ready to activate)
   
   Option B: cic roadmap reject <itemId>
            → state: rejected (won't adopt)
         ↓
6. If approved, activate when ready:
   cic roadmap activate <itemId>
         ↓
7. Activation flow:
   - Verify Docker build succeeded
   - Verify tests passed
   - Flip CIC config to use new extractor
   - Mark state: active
         ↓
8. After extraction runs, detect drift:
   cic roadmap drift codeflow
   
   If severe drift:
   → Create new must-adopt item for drift
   → Operator approves → activates
         ↓
9. Release gate checks:
   cic release gates
   
   "Are all must-adopt blocking items active?"
   If not → RELEASE BLOCKED
   If yes → RELEASE APPROVED
```

---

## Release Blocking

**Release CI integration:**

```bash
#!/bin/bash
# pre-release.sh

# Check if release can proceed
GATE_RESULT=$(curl -s http://roadmap-service:3000/release-gates)

if [[ $(echo $GATE_RESULT | jq .blocked) == "true" ]]; then
  echo "RELEASE BLOCKED: $(echo $GATE_RESULT | jq .reason)"
  exit 1
fi

echo "RELEASE APPROVED"
```

**What blocks a release:**
- Any `must-adopt` item with `state != "active"` and `blocking: true`
- Example: Security update waiting for approval → blocks release

**What doesn't block:**
- `optional` items (regardless of state)
- `must-adopt` items with `blocking: false`
- Completed/active items

---

## Policy Customization

Edit `policy-manifest.yaml` to add repo-specific rules:

```yaml
repos:
  my-new-repo:
    - match: "mandatory_update.*"
      adoption: "must-adopt"
      blocking: false            # Non-blocking for this repo
      deadline: "within-1-month"
      reason: "Integration updates"
    
    - match: "roadmap_idea.*"
      adoption: "optional"
      blocking: false
      deadline: null
```

Reload policy (no restart needed):
```bash
cic roadmap policy --reload
```

---

## Drift Thresholds

Configure in `policy-manifest.yaml`:

```yaml
drift_thresholds:
  missing_edges: 10          # Flag if >10 edges missing
  missing_security: 5        # Flag if >5 security findings missing
  missing_patterns: 20       # Flag if >20 patterns missing
  drift_age_hours: 24        # Flag if drift persists >24h
```

Drift auto-escalates:
- **After 24h:** Change from `medium` to `high` severity
- **After 48h:** Create escalation item for oncall

---

## Audit Trail

All state changes are logged:

```bash
cic roadmap show <itemId> --history

# Output:
# [2026-06-11T09:43:15Z] update-monitor: candidate ← (created)
# [2026-06-11T09:44:20Z] soren: approved ← candidate (Reviewed and approved)
# [2026-06-11T09:50:30Z] soren: active ← approved (Docker image verified)
```

---

## Examples

### Security Fix Workflow

```bash
# 1. CodeFlow detects security issue
# Update Monitor creates item:
# - state: candidate
# - policy: must-adopt, blocking
# - deadline: before-next-release

# 2. Operator reviews
cic roadmap list --source=external --priority=high
# Shows security item

# 3. Operator approves
cic roadmap approve roadmap-item-123
# Item ready for activation

# 4. Verify Docker build
docker pull rewrite/codeflow-analyzer:codeflow-sec-fix-sha

# 5. Activate
cic roadmap activate roadmap-item-123

# 6. Check release gate
cic release gates
# ✓ RELEASE APPROVED (all must-adopt items active)
```

### Drift Recovery

```bash
# 1. Drift detected
cic roadmap drift codeflow
# Status: DRIFTING
# Severity: HIGH
# Missing: 5 security issues, 18 edges, 12 patterns

# 2. Operator investigates
# (Drift item auto-created as must-adopt)

# 3. Approve drift item
cic roadmap approve roadmap-drift-codeflow-456

# 4. Run extraction again to sync
cic extractor run codeflow

# 5. Check drift again
cic roadmap drift codeflow
# Status: IN SYNC ✓
```

---

## Monitoring

**Grafana panels:**
- Must-adopt items pending approval/activation
- Drift severity trends
- Release gate status
- Policy evaluation distribution (must-adopt vs optional)

**Alerts:**
- Drift severity high → page oncall
- Security issue blocking release → page oncall
- Drift persisting >48h → escalate

---

## Best Practices

1. **Security first:** All security issues are must-adopt + blocking by default
2. **Review before approve:** Always run `cic roadmap show <itemId>` before approval
3. **Monitor drift:** Run `cic roadmap drift <repo>` weekly
4. **Release gates:** Always run `cic release gates` before cutting release
5. **Audit trail:** Keep records of who approved what and when

---

## Implementation Notes

**Drift Detector Field Mapping (Commit 7ceafb1):**
- CicSnapshot stores security findings with `category` field, CodeFlow analyzer outputs with `type` field
- Pattern comparison maps `pattern` field (CIC) to `type` field (CodeFlow)
- Ensures accurate divergence detection: same issue type from different sources correctly matched

**Example:**
```
CIC security item:  { file: "auth.js", line: 42, category: "hardcoded_secret" }
CodeFlow finding:   { file: "auth.js", line: 42, type: "hardcoded_secret" }
→ Comparison key: "auth.js:42:hardcoded_secret"  ✓ MATCH (no false positive drift)
```

---

**Ready for deployment.** Wire governance layer into existing docker-compose:

```yaml
services:
  roadmap-service:
    volumes:
      - ./policy-manifest.yaml:/app/policy-manifest.yaml
    environment:
      POLICY_MANIFEST_PATH: /app/policy-manifest.yaml
```

All three layers (policy, approval, drift) now enforce human governance while automation handles the heavy lifting.
