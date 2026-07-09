---
title: "Phase 27 Wave F: Golden Test Fixtures"
summary: "**Purpose:** Realistic end-to-end test scenarios for Phase 27 ingestion pipeline"
updated: "2026-07-09"
tags:
  - cic
---
# Phase 27 Wave F: Golden Test Fixtures

**Purpose:** Realistic end-to-end test scenarios for Phase 27 ingestion pipeline

## Fixture Library

### Golden Ingestion Manifest

**File:** `cic-ingestion/fixtures/golden-ingestion-manifest.jsonl`

**Scenario:** Normal production day, diverse API sources

**Records (10 total):**

| ID | Source | Profile | Lane | Status | Notes |
|---|---|---|---|---|---|
| api-github-001 | api.github.com/repos | api | fast | ✅ | Public API, low latency |
| web-example-001 | example.com/docs | web | deep | ✅ | HTML extraction + semantic |
| api-stripe-001 | api.stripe.com/v1 | api | fast | ✅ | Payment API, quick |
| local-csv-001 | file:///data/exports | local | slow | ✅ | Local CSV, batch extraction |
| api-openai-001 | api.openai.com/v1 | api | fast | ✅ | AI service, high priority |
| web-blog-001 | blog.example.com | web | deep | ✅ | Blog post, text + semantic |
| api-datadog-001 | api.datadoghq.com | api | fast | ✅ | Metrics API, low cost |
| pdf-whitepaper-001 | cdn.example.com/pdfs | web | slow | ✅ | PDF extraction, high cost |
| api-github-002 | api.github.com/search | api | fast | ✅ | GitHub search, fast |
| web-forum-001 | forums.example.com | web | deep | ✅ | Forum discussion, semantic |

**Use Cases:**
- Validate routing (different profiles: api, web, local)
- Validate lanes (fast, deep, slow)
- Validate cost tracking (5–60 cost per record)
- Validate timestamps (full ingested→verified→indexed chain)
- Load testing (10 diverse records)

**Load with:**
```bash
cp cic-ingestion/fixtures/golden-ingestion-manifest.jsonl cic-ingestion/ingestionManifest.jsonl
npm test -- cic-ingestion/src/ingestion/ingestion-wave-f-master-gate.test.ts
```

---

### Golden Quarantine Scenario

**File:** `cic-ingestion/fixtures/golden-quarantine-scenario.jsonl`

**Scenario:** Three entries requiring operator review

**Records (3 total):**

1. **quarantine-network-001** — Network timeout
   - Source: unstable API
   - Error: Network timeout after 30s
   - Retry count: 3
   - Action: Approve to "fast" lane after upstream fixed

2. **quarantine-parse-001** — Invalid JSON
   - Source: broken API endpoint
   - Error: Invalid JSON (parsing failed)
   - Retry count: 0
   - Action: Reject (upstream bug, wait for fix)

3. **quarantine-semantic-001** — Semantic validation failed
   - Source: unusual HTML structure
   - Error: Missing required fields in schema
   - Retry count: 1
   - Action: Approve to "slow" lane after manual inspection

**Use Cases:**
- Validate quarantine detection
- Test operator approval workflow
- Validate forceReingest flag
- Test lane reassignment

**Workflow Example:**
```bash
# Load fixture
cp cic-ingestion/fixtures/golden-quarantine-scenario.jsonl cic-ingestion/ingestionManifest.jsonl

# List quarantined
npm run cic-ingestion -- quarantine list
# Output: 3 items

# Approve network timeout to fast lane
npm run cic-ingestion -- quarantine approve quarantine-network-001 fast

# Verify approval
npm run cic-ingestion -- quarantine list
# quarantine-network-001 should now have lane=fast, forceReingest=true
```

---

### Golden Archival Scenario

**File:** `cic-ingestion/fixtures/golden-archival-scenario.jsonl`

**Scenario:** Four records > 90 days old (ready for archival)

**Records (4 total):**

| ID | Date | Age (days) | Profile | Extractors | Cost |
|---|---|---|---|---|---|
| archive-old-001 | 2026-04-05 | 93 | api | JSONExtractor | 15 |
| archive-old-002 | 2026-04-03 | 95 | local | CSVExtractor | 35 |
| archive-old-003 | 2026-04-01 | 97 | api | JSONExtractor | 20 |
| archive-old-004 | 2026-03-28 | 101 | local | TarExtractor | 110 |

**Use Cases:**
- Validate prune detection (all > 90d cutoff)
- Validate archive filename format (manifests-archived-YYYY-MM-DD.jsonl)
- Validate archive contains correct records
- Test retention policy boundary

**Workflow Example:**
```bash
# Load fixture with old dates
cp cic-ingestion/fixtures/golden-archival-scenario.jsonl cic-ingestion/ingestionManifest.jsonl

# Dry-run prune to see what will be archived
npm run cic-ingestion -- prune --dry-run
# Output: retainedRecords=0, archivedRecords=4

# Execute prune
npm run cic-ingestion -- prune --retention 90

# Verify archive created
ls cic-ingestion/manifests-archived/
# Output: manifests-archived-2026-04-05.jsonl, etc

# Verify manifest is empty (all records archived)
wc -l cic-ingestion/ingestionManifest.jsonl
# Output: 0 lines

# Verify archive contents
jq .id cic-ingestion/manifests-archived/*.jsonl
# Output: archive-old-001, archive-old-002, archive-old-003, archive-old-004
```

---

### Golden Repair Scenario

**File:** `cic-ingestion/fixtures/golden-repair-scenario.jsonl`

**Scenario:** Mix of valid (5) and corrupted (3) records

**Records (8 lines total):**

| Line | ID | Status | Issue |
|---|---|---|---|
| 1 | valid-001 | ✅ | Complete, valid JSON |
| 2 | valid-002 | ✅ | Complete, valid JSON |
| 3 | corrupted-001 | ❌ | Missing required fields (incomplete) |
| 4 | valid-003 | ✅ | Complete, valid JSON |
| 5 | (none) | ❌ | Invalid JSON (not JSON at all) |
| 6 | valid-004 | ✅ | Complete, valid JSON |
| 7 | incomplete-field | ❌ | Missing required fields (lane, extractorsRun, etc) |
| 8 | valid-005 | ✅ | Complete, valid JSON |

**Use Cases:**
- Validate repair detection (3 corrupted lines)
- Validate backup creation
- Validate removal of corrupted records
- Validate final manifest integrity (5 valid records)

**Workflow Example:**
```bash
# Load fixture with mixed records
cp cic-ingestion/fixtures/golden-repair-scenario.jsonl cic-ingestion/ingestionManifest.jsonl

# Dry-run repair to see what will be removed
npm run cic-ingestion -- repair --dry-run
# Output:
# {
#   "totalLines": 8,
#   "validLines": 5,
#   "corruptedLines": 3,
#   "missingFields": [...]
# }

# Execute repair
npm run cic-ingestion -- repair

# Verify backup created
ls cic-ingestion/ingestionManifest.backup.jsonl
# Backup contains all 8 lines (including corrupted)

# Verify manifest cleaned
wc -l cic-ingestion/ingestionManifest.jsonl
# Output: 5 lines (valid only)

# Verify specific records retained
jq .id cic-ingestion/ingestionManifest.jsonl
# Output: valid-001, valid-002, valid-003, valid-004, valid-005

# Verify backup has corrupted lines
jq .id cic-ingestion/ingestionManifest.backup.jsonl | sort | uniq
# Output: corrupted-001, incomplete-field (among others)
```

---

## Creating Custom Fixtures

### Template: API Record

```json
{
  "id": "custom-api-001",
  "source": "https://api.example.com/v1/data",
  "mediaType": "application/json",
  "profile": "api",
  "lane": "fast",
  "extractorsRun": ["JSONExtractor"],
  "verification": {"passed": true, "errors": []},
  "operatorFlags": {},
  "timestamps": {
    "ingested": "2026-07-07T10:00:00Z",
    "verified": "2026-07-07T10:00:05Z",
    "indexed": "2026-07-07T10:00:10Z"
  },
  "routingVersion": "1.0.0",
  "retryCount": 0,
  "cost": {"extractorCost": 5, "verificationCost": 2, "totalCost": 7}
}
```

### Template: Web Record

```json
{
  "id": "custom-web-001",
  "source": "https://example.com/article",
  "mediaType": "text/html",
  "profile": "web",
  "lane": "deep",
  "extractorsRun": ["HTMLExtractor", "TextExtractor"],
  "verification": {"passed": true, "errors": []},
  "operatorFlags": {},
  "timestamps": {
    "ingested": "2026-07-07T11:00:00Z",
    "verified": "2026-07-07T11:00:30Z",
    "indexed": "2026-07-07T11:01:00Z"
  },
  "routingVersion": "1.0.0",
  "retryCount": 0,
  "cost": {"extractorCost": 15, "verificationCost": 8, "totalCost": 23}
}
```

### Template: Quarantine Record

```json
{
  "id": "custom-quarantine-001",
  "source": "https://unknown-api.example.com",
  "mediaType": "application/json",
  "profile": "unknown",
  "lane": "quarantine",
  "extractorsRun": [],
  "verification": {"passed": false, "errors": ["Network timeout"]},
  "operatorFlags": {"quarantine": true},
  "timestamps": {"ingested": "2026-07-07T10:30:00Z"},
  "routingVersion": "1.0.0",
  "retryCount": 3,
  "cost": {"extractorCost": 0, "verificationCost": 0, "totalCost": 0}
}
```

### Template: Old Record (Archive)

```json
{
  "id": "custom-archive-001",
  "source": "https://legacy-api.example.com",
  "mediaType": "application/json",
  "profile": "api",
  "lane": "slow",
  "extractorsRun": ["JSONExtractor"],
  "verification": {"passed": true, "errors": []},
  "operatorFlags": {},
  "timestamps": {
    "ingested": "2026-03-15T08:00:00Z"
  },
  "routingVersion": "0.9.0",
  "retryCount": 0,
  "cost": {"extractorCost": 10, "verificationCost": 5, "totalCost": 15}
}
```

---

## Using Fixtures in Tests

```typescript
// Load golden fixture
import * as fs from "fs";

const fixture = fs
  .readFileSync("fixtures/golden-ingestion-manifest.jsonl", "utf-8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

// Validate structure
fixture.forEach((record) => {
  expect(record.id).toBeDefined();
  expect(record.source).toBeDefined();
  expect(record.profile).toBeDefined();
  expect(record.lane).toBeDefined();
  expect(record.timestamps).toBeDefined();
});

// Use in tests
describe("E2E with golden fixture", () => {
  beforeEach(() => {
    fs.copyFileSync(
      "fixtures/golden-ingestion-manifest.jsonl",
      "cic-ingestion/ingestionManifest.jsonl"
    );
  });

  test("repair handles golden fixture", () => {
    const stats = repairManifest();
    expect(stats.totalLines).toBe(10);
    expect(stats.validLines).toBe(10);
  });

  test("prune recognizes all recent records", () => {
    const stats = pruneManifest(90);
    expect(stats.retainedRecords).toBe(10);
    expect(stats.archivedRecords).toBe(0);
  });
});
```

---

See also: [phase-27-wave-f-architecture.md](./phase-27-wave-f-architecture.md)
