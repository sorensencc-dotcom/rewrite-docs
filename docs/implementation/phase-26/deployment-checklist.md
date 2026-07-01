# Phase 26 — Deployment Checklist

**Version:** 1.0.0  
**Date:** July 1, 2026  
**Commit:** 8bbc49a  
**Owner:** DevOps / SRE

---

## 1. Pre-Deployment Verification

### 1.1 Code Status

- [ ] Commit 8bbc49a merged to main
- [ ] All tests PASS (28/28)
- [ ] Code review completed
- [ ] No security warnings from pre-commit hooks
- [ ] Documentation complete (3/3 docs)

**Verify:**
```bash
git log --oneline -1  # Should show "refactor: extract deterministic embedding..."
npm test -- src/tests/mcp-xai.test.ts  # Should PASS
npm test -- src/tests/xai-ingestion-flow.test.ts  # Should PASS
```

### 1.2 Dependency Audit

- [ ] No new external HTTP dependencies added
- [ ] `node-fetch` pinned to v2.6.11+ (if used)
- [ ] Crypto module (native Node.js) available
- [ ] SQLite bindings stable
- [ ] TypeScript compilation succeeds

**Verify:**
```bash
npm audit  # Should show 0 critical/high
npm run build  # Should complete without errors
```

---

## 2. Local Environment Setup

### 2.1 Environment Variables

Create or update `.env` or `.env.local`:

```bash
# CIC Ingestion
CIC_INGESTION_PORT=3000
CIC_INGESTION_ENV=production

# TorqueQuery
TORQUE_QUERY_URL=http://localhost:3001
TORQUE_QUERY_PORT=3001
TORQUE_DB_PATH=./db/torque.db

# xAI MCP
MCP_ENDPOINT=wss://docs.x.ai/mcp/v1
MCP_TIMEOUT=30000
MCP_RETRIES=3
MCP_BACKOFF_MS=100

# CIC Core
CIC_MEMORY_PATH=./data/memory
CIC_AUDIT_LOG_PATH=./data/audit
CIC_DETERMINISTIC_MODE=true
CIC_DRIFT_DETECTION=enabled
```

- [ ] `.env` file created
- [ ] All MCP variables set
- [ ] All CIC variables set
- [ ] Deterministic mode enabled
- [ ] Drift detection enabled

**Verify:**
```bash
cat .env | grep MCP_ENDPOINT  # Should show WebSocket endpoint
cat .env | grep DETERMINISTIC  # Should show "true"
```

### 2.2 Database Initialization

- [ ] SQLite database directory exists: `./db/`
- [ ] Schema migration applied: `services/torquequery/src/db/schema.sql`
- [ ] `document_chunks` table created
- [ ] Indexes on `doc_id`, `embedding` created
- [ ] No existing data conflicts

**Verify:**
```bash
sqlite3 ./db/torque.db ".tables"  # Should list "document_chunks"
sqlite3 ./db/torque.db ".schema document_chunks"  # Should show columns
```

---

## 3. Service Startup (Local)

### 3.1 Start TorqueQuery Service

```bash
cd services/torquequery
npm install
npm run dev  # Starts on port 3001
```

- [ ] TorqueQuery listening on port 3001
- [ ] SQLite database initialized
- [ ] `/v1/health` endpoint responds 200

**Verify:**
```bash
curl http://localhost:3001/v1/health
# Expected: {"status":"ok","version":"..."}
```

### 3.2 Start CIC Ingestion Service

```bash
cd cic-ingestion
npm install
npm run dev  # Starts on port 3000
```

- [ ] CIC Ingestion listening on port 3000
- [ ] TorqueQuery client initialized
- [ ] MCP client initialized (WebSocket ready)
- [ ] `/health` endpoint responds 200

**Verify:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","services":{"torquequery":"connected",...}}
```

### 3.3 Verify MCP Connection

- [ ] MCP WebSocket connects without error
- [ ] MCP JSON‑RPC handshake succeeds
- [ ] Deterministic request IDs generated
- [ ] No connection timeouts

**Verify:**
```bash
curl -X POST http://localhost:3000/mcp/ping \
  -H "Content-Type: application/json" \
  -d '{"method":"listDocs","params":{}}'
# Expected: {"jsonrpc":"2.0","result":[...],"id":"..."}
```

---

## 4. Integration Testing (Manual)

### 4.1 MCP Search Endpoint

Test: `/mcp/xai/search` (POST)

```bash
curl -X POST http://localhost:3000/mcp/xai/search \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "test-doc",
    "query": "deterministic",
    "limit": 10
  }'
```

- [ ] Endpoint responds 200
- [ ] Results include chunks with embeddings
- [ ] Embeddings are 768-dimensional
- [ ] Results are deterministically ordered

### 4.2 MCP Ingest Endpoint

Test: `/mcp/xai/ingest` (POST)

```bash
curl -X POST http://localhost:3000/mcp/xai/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "test-doc-v1",
    "text": "This is a test document for deterministic ingestion.",
    "source": "xai-docs-mcp",
    "url": "https://docs.x.ai/test"
  }'
```

- [ ] Endpoint responds 200
- [ ] Document inserted into `document_chunks` table
- [ ] Chunks are stable and reproducible
- [ ] Embedding hash computed correctly

### 4.3 Verify Database Writes

```bash
sqlite3 ./db/torque.db "SELECT COUNT(*) FROM document_chunks;"
# Expected: >= 1 (at least test doc written)

sqlite3 ./db/torque.db \
  "SELECT id, chunk_index, embedding FROM document_chunks LIMIT 1;"
# Expected: Rows with proper structure
```

- [ ] document_chunks table has entries
- [ ] All columns populated
- [ ] Embedding JSON valid

### 4.4 Determinism Validation

Ingest same document twice, verify identical results:

```bash
# First ingest
curl -X POST http://localhost:3000/mcp/xai/ingest \
  -H "Content-Type: application/json" \
  -d '{"docId":"dup-test","text":"Determinism test","source":"xai-docs-mcp"}'

# Query first result
sqlite3 ./db/torque.db \
  "SELECT embedding FROM document_chunks WHERE doc_id='dup-test' LIMIT 1;" > /tmp/result1.json

# Second ingest (same docId, same text)
curl -X POST http://localhost:3000/mcp/xai/ingest \
  -H "Content-Type: application/json" \
  -d '{"docId":"dup-test","text":"Determinism test","source":"xai-docs-mcp"}'

# Query second result
sqlite3 ./db/torque.db \
  "SELECT embedding FROM document_chunks WHERE doc_id='dup-test' LIMIT 1;" > /tmp/result2.json

# Compare (should be identical)
diff /tmp/result1.json /tmp/result2.json
# Expected: No diff (identical)
```

- [ ] Same input → same embedding (100% deterministic)
- [ ] No drift detected across runs

---

## 5. CIC Pipeline Integration

### 5.1 Adapter Registration

- [ ] XaiDocsMcpAdapter registered in AdapterRegistry
- [ ] Adapter accessible via `registry.get("xai-docs-mcp")`
- [ ] No conflicts with existing adapters

**Verify:**
```bash
# In CIC shell or via API
GET /adapters
# Expected: xai-docs-mcp in list
```

### 5.2 Ingest Pipeline

- [ ] Phase 26 module enabled in CIC config
- [ ] Ingestion pipeline recognizes xAI source
- [ ] World‑corpus indexing enabled
- [ ] Audit logs contain xAI entries

**Verify:**
```bash
curl http://localhost:3000/ingest/status
# Expected: xai-docs-mcp in active sources
```

### 5.3 Drift Scoring Integration

- [ ] Drift scorer accepts xAI embeddings
- [ ] Embedding hashes computed correctly
- [ ] No baseline drift detected
- [ ] Historical hashes stable

---

## 6. Error Handling Verification

### 6.1 Network Failures

- [ ] MCP timeout (30s) handled gracefully
- [ ] Retry logic applies fixed backoff (3 retries)
- [ ] Deterministic error codes returned
- [ ] No cascade failures to CIC pipeline

**Test:**
```bash
# Simulate MCP offline (unplug network)
curl -X POST http://localhost:3000/mcp/xai/search ...
# Expected: 503 Service Unavailable after 30s
```

### 6.2 Invalid Input

- [ ] Empty `docId` rejected (400)
- [ ] Missing `text` rejected (400)
- [ ] Invalid source rejected (400)
- [ ] Non‑existent doc returns 404

**Test:**
```bash
curl -X POST http://localhost:3000/mcp/xai/ingest \
  -H "Content-Type: application/json" \
  -d '{"docId":"","text":"","source":""}'
# Expected: 400 Bad Request
```

### 6.3 Database Failures

- [ ] Write failures logged and surfaced
- [ ] No silent failures
- [ ] Retry logic applies
- [ ] Circuit breaker prevents cascade

---

## 7. Performance Baseline Validation

### 7.1 Latency Targets

- [ ] Chunking 100KB doc: <500ms
- [ ] 10‑chunk embedding: <1s
- [ ] TorqueQuery ingest: <2s/100 chunks
- [ ] Full E2E pipeline: <5s

**Test:**
```bash
time curl -X POST http://localhost:3000/mcp/xai/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "docId":"perf-test",
    "text":"Lorem ipsum ... [100KB text]",
    "source":"xai-docs-mcp"
  }'
# Expected: real ~1s, user ~0.5s
```

### 7.2 Memory Usage

- [ ] Baseline memory footprint: <150MB
- [ ] No memory leaks after 1000 requests
- [ ] Stable heap usage

**Monitor:**
```bash
# In separate terminal
watch -n 1 'ps aux | grep -E "node|torque|ingestion" | grep -v grep'
```

### 7.3 Throughput

- [ ] 100 documents ingested: <10s
- [ ] 1000 chunks processed: <30s
- [ ] Query latency stable under load

---

## 8. Monitoring & Observability

### 8.1 Logging Setup

- [ ] Structured logs enabled (JSON format)
- [ ] Log level: INFO in production
- [ ] xAI events tagged with `source: xai-docs-mcp`
- [ ] Audit logs contain document lineage

**Verify:**
```bash
tail -f logs/cic-ingestion.log | jq 'select(.source=="xai-docs-mcp")'
# Expected: Streaming xAI events
```

### 8.2 Metrics Collection

- [ ] MCP latency exported (histogram)
- [ ] Chunking throughput exported
- [ ] Document count gauge
- [ ] Error rate counter

**Verify:**
```bash
curl http://localhost:3000/metrics
# Expected: mcp_latency_ms, chunk_count, etc.
```

### 8.3 Alerting

- [ ] MCP connection loss triggers alert
- [ ] Database write failure triggers alert
- [ ] Determinism violation triggers alert
- [ ] Runbook attached to each alert

---

## 9. Production Rollout (Multi-Region)

### 9.1 Canary Deployment

- [ ] Deploy Phase 26 to canary region (10% traffic)
- [ ] Monitor error rate for 1 hour
- [ ] Verify determinism across 100 documents
- [ ] Zero unplanned restarts

### 9.2 Rolling Update

- [ ] Deploy to region 1 (25% traffic) → STABLE?
- [ ] Deploy to region 2 (25% traffic) → STABLE?
- [ ] Deploy to region 3 (25% traffic) → STABLE?
- [ ] Deploy to region 4 (25% traffic) → STABLE?

### 9.3 Monitoring Post-Deployment

- [ ] Error rate < 0.1%
- [ ] Latency p99 < 2s
- [ ] Throughput > 100 docs/min
- [ ] Zero determinism violations

**Duration:** 24 hours

---

## 10. Rollback Plan

If issues detected:

1. **Immediate:** Set `PHASE_26_ENABLED=false` in config
2. **Service restart:** `systemctl restart cic-ingestion`
3. **Data cleanup:** Archive xAI entries in `document_chunks` (preserve for audit)
4. **Verification:** Confirm CIC pipeline reverted to Phase 25

**Estimated rollback time:** 5 minutes

---

## 11. Post-Deployment Sign‑Off

### 11.1 Deployment Completion

| Step | Assigned To | Status | Timestamp |
|------|-------------|--------|-----------|
| Pre-deployment verification | DevOps | [ ] | — |
| Local environment setup | DevOps | [ ] | — |
| Service startup (local) | DevOps | [ ] | — |
| Integration testing (manual) | QA | [ ] | — |
| CIC pipeline integration | Platform | [ ] | — |
| Error handling verification | QA | [ ] | — |
| Performance baseline | Performance | [ ] | — |
| Monitoring & observability | SRE | [ ] | — |
| Canary deployment (10%) | DevOps | [ ] | — |
| Rolling update (100%) | DevOps | [ ] | — |

### 11.2 Final Checklist

- [ ] All steps completed and signed off
- [ ] No critical issues blocking rollout
- [ ] Rollback plan tested and documented
- [ ] Runbooks updated
- [ ] Team notified of Phase 26 availability

**Deployment Status: Ready for Production** ✅

---

**Deployment Authority:** Engineering Manager  
**Date Authorized:** [FILL]  
**Deployment Window:** [FILL]  
**Rollback Authority:** [FILL]
