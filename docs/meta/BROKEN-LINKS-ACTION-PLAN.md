# Broken Links Quick-Fix Action Plan

**Status:** 357 broken links detected across 190 docs pages  
**Last Sync:** 2026-07-08  
**Estimated Fix Time:** 2-4 hours for 80% reduction

---

## 🚀 Quick Wins (Do These First)

### Fix 1: Update 79 broken links in `docs/cic/index.md` 
**Impact:** -22% of all broken links  
**Action:** Review file and replace relative paths with correct references  
**Time:** 30-45 min

```bash
# Check current state
grep -n "^\[" docs/cic/index.md | head -20
```

### Fix 2: Create stub files for top 5 missing docs
**Impact:** -~35 links  
**Action:** Create these files (can be minimal stubs initially):
- [ ] `docs/cic/phases/phase-2-architecture.md`
- [ ] `docs/cic/phases/sandbox-3-architecture.md`
- [ ] `docs/cic/phases/phase-2-training-loop.md`
- [ ] `docs/cic/phases/phase-27-wave-f-architecture.md`
- [ ] `docs/cic/phases/sandbox-3-runtime.md`

**Time:** 15-20 min (minimal stubs)

### Fix 3: Fix relative path references
**Impact:** -~20 links  
**Files affected:**
- `docs/cic/cic-maal-audit-overview.md` (28 broken links)
- `docs/cic/phases/phase-2-overview.md` (10 broken links)

**Pattern to fix:**
```
Before: ../roadmaps/cic-roadmap.md
After:  ../../roadmaps/cic-roadmap.md  # (adjust for directory depth)
```

**Time:** 20-30 min

---

## 🔧 Medium-Term Fixes

### Strategy 4: Vault Integration (-46 links)
Create symlinks or redirect stubs:
```bash
# Option A: Symlinks
ln -s ../../cic-ref docs/cic-ref
ln -s ../../rl-ref docs/rl-ref

# Option B: Create stub files that redirect
# docs/cic-ref/overview.md -> Points to ../../cic-ref/overview.md
```

**Time:** 1-2 hours (including testing)

### Strategy 5: Create missing overview files (-12 links)
Files like `overview.md`, `phase-1-overview.md` that are referenced but don't exist.

**Time:** 30 min

---

## 📊 Progress Tracking

After each fix, run sync to verify improvement:

```bash
cd /dev/cic-os/personal-knowledge-base
python3 sync.py
# Check: _integration/sync-report.json for updated counts
```

---

## Expected Timeline

| Phase | Time | Broken Links | Progress |
|-------|------|--------------|----------|
| Start | — | 357 | 0% ✗ |
| Fix 1 + 2 | 1 hr | ~250 | 30% ✓ |
| Fix 3 | 1.5 hr | ~230 | 36% ✓ |
| Fix 4 + 5 | 2 hr | ~120 | 66% ✓ |
| Polish | 1 hr | <50 | 86%+ ✓ |

---

## Detailed Analysis

See **broken-links-report.md** for:
- Complete list of all 357 broken links
- Organized by fix strategy
- Source files with most issues
- Recommended approach for each category

## Sync Automation

The sync now runs nightly. To check status:
```bash
cat /dev/cic-os/personal-knowledge-base/_integration/sync-report.json | jq '.summary'
```
