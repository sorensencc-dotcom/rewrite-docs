---
title: "TORQUEQUERY QUICKSTART"
summary: "# TorqueQuery Quick Start"
created: "2026-07-03T19:43:45.667Z"
updated: "2026-07-03T19:43:45.667Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# TorqueQuery Quick Start

Get TorqueQuery running locally in 5 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- npm 8+

## Option 1: Automated Setup (Recommended)

### Windows PowerShell
```powershell
cd rewrite-mcp/services/torquequery-mcp
.\setup-and-validate.ps1
```

This:
1. ✓ Checks Node.js, npm, PostgreSQL
2. ✓ Builds substrate service
3. ✓ Applies database schema
4. ✓ Starts substrate service
5. ✓ Runs 38 tests
6. ✓ Reports results

**Estimated time:** 2-3 minutes

---

## Option 2: Manual Setup

### Step 1: Prepare Database
```bash
# Start PostgreSQL with pgvector (Docker)
docker run --name postgres-pgvector \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16

# Apply schema
# (Download schema.sql from services/cic-substrate/schema.sql)
psql postgresql://postgres:postgres@localhost:5432/postgres < schema.sql
```

### Step 2: Start Substrate Service
```bash
cd services/cic-substrate
npm install
npm run build
npm run dev
```

Expected output:
```
CIC Substrate Service running on port 3000
```

### Step 3: Run MCP Server Tests
In a new terminal:
```bash
cd rewrite-mcp/services/torquequery-mcp
npm install
npm run build
npm test
```

Expected output:
```
PASS  src/integration.test.ts
  ✓ 38 tests passed
Tests: 38 passed, 38 total
```

---

## Verify Installation

### Check Substrate Service
```bash
curl http://localhost:3000/stats
# Expected: JSON array of statistics
```

### Check Database
```bash
psql postgresql://postgres:postgres@localhost:5432/postgres \
  -c "SELECT COUNT(*) FROM tq_chunks;"
# Expected: 0 (or positive integer if data exists)
```

### Run a Quick Test
```bash
cd rewrite-mcp/services/torquequery-mcp

# Store a chunk
curl -X POST http://localhost:3000/chunks \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "test",
    "type": "SYSTEM",
    "title": "Test Chunk",
    "body": "This is a test",
    "provenance": {"source": "quickstart"}
  }'

# List chunks
curl http://localhost:3000/stats
```

---

## Using the MCP Server

### Run MCP Server
```bash
cd rewrite-mcp/services/torquequery-mcp
npm run dev
```

### In Claude (or your MCP client)
```
Available tools:
  - store_chunk
  - search_chunks
  - get_task_context
  - get_chunk
  - list_chunks
  - update_chunk
  - delete_chunk
  - get_stats
```

### Example: Store a Chunk
```json
{
  "namespace": "my-project/docs",
  "type": "LIVING",
  "title": "API Design Guidelines",
  "body": "REST APIs should use standard HTTP methods...",
  "tags": ["api", "design"],
  "importance": 0.8,
  "provenance": {"source": "design-guidelines.md"}
}
```

### Example: Search
```json
{
  "namespace": "my-project/docs",
  "query": "API design best practices",
  "max_results": 5
}
```

### Example: Get Context for Task
```json
{
  "namespace": "my-project/codebase",
  "task": "Implement new authentication middleware",
  "max_context_tokens": 4000
}
```

---

## Development Workflow

### Run Tests
```bash
cd rewrite-mcp/services/torquequery-mcp
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode (Auto-run tests on file change)
```bash
npm run test:watch
```

### Build Only
```bash
npm run build
```

---

## Troubleshooting

### "PostgreSQL connection failed"
```bash
# Check PostgreSQL is running
psql --version

# If using Docker, verify container
docker ps | grep postgres

# Start PostgreSQL
docker run --name postgres-pgvector \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16
```

### "Substrate service not responding"
```bash
# Check if service is running
curl http://localhost:3000/stats

# Check logs
# Terminal running substrate service should show errors

# Restart service
# Kill process and run: npm run dev
```

### "Tests failing with connection errors"
```bash
# Make sure substrate service is running
cd services/cic-substrate && npm run dev

# Wait 5 seconds for service startup
# Then run tests in another terminal
npm test
```

### "Module not found errors"
```bash
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
npm run build
```

### "Port already in use"
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

---

## File Structure

```
c:\dev\
├── services\cic-substrate\              # Substrate HTTP API
│   ├── src\
│   │   ├── index.ts                    # Express server
│   │   ├── handlers.ts                 # HTTP handlers
│   │   ├── governance.ts               # Validation rules
│   │   ├── ingestion.ts                # 5-step pipeline
│   │   ├── retrieval.ts                # BM25 + Vector search
│   │   ├── context.ts                  # Token packing
│   │   └── db.ts                       # PostgreSQL client
│   ├── schema.sql                      # Database schema
│   ├── package.json
│   └── README.md
│
└── rewrite-mcp\services\torquequery-mcp\  # MCP Server
    ├── src\
    │   ├── index.ts                    # MCP server
    │   ├── substrate-client.ts         # HTTP client
    │   └── integration.test.ts         # 38 tests
    ├── jest.config.js
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── README.md
    ├── VALIDATION.md
    ├── setup-and-validate.ps1
    └── setup-and-validate.sh
```

---

## Next Steps

### 1. Explore the API
- Read [TORQUEQUERY_MCP_REFERENCE.md](torquequery-mcp-reference.md) for tool reference
- Try storing a chunk with different types
- Search for chunks using text and embeddings
- Get task context with token budget

### 2. Understand the Rules
- Read [TORQUEQUERY_BUILD_SUMMARY.md](torquequery-build-summary.md) for architecture
- Review [rewrite-mcp/services/torquequery-mcp\README.md](rewrite-mcp/services/torquequery-mcp\README.md)
- Check test cases in `src/integration.test.ts`

### 3. Integrate with Your Project
- Store project documentation as chunks
- Use search to find relevant context
- Use get_task_context to pack context for AI tasks
- Monitor stats to track usage

### 4. Deploy
- Build Docker image (see README.md)
- Push to container registry
- Deploy to Kubernetes (manifests in README.md)
- Set up monitoring and alerting

---

## Quick Reference

### Chunk Types & TTL
| Type | TTL | Use Case |
|------|-----|----------|
| SYSTEM | ∞ | Architecture, standards, decisions |
| LIVING | ∞ | Evolving docs, patterns |
| STATE | 30d | Snapshots, deployment status |
| SCRATCH | 7d | Temp notes, WIP |

### Importance Scale
- 0.9-1.0 → Critical knowledge
- 0.7-0.9 → Important context
- 0.5-0.7 → Regular documentation
- 0.0-0.5 → Supplementary info

### Context Packing
- Default budget: 4000 tokens ≈ 2000 words
- Type priority: SYSTEM > LIVING > STATE > SCRATCH
- Sorted by relevance score within type

---

## Support

### Documentation
- [MCP Tool Reference](torquequery-mcp-reference.md)
- [Build Summary](torquequery-build-summary.md)
- [Validation Guide](rewrite-mcp/services/torquequery-mcp\VALIDATION.md)
- [README](rewrite-mcp/services/torquequery-mcp\README.md)

### Testing
- Run: `npm test`
- Coverage: `npm run test:coverage`
- Watch: `npm run test:watch`

### Logs
- Substrate service: stdout from `npm run dev`
- MCP server: stdout from `npm run dev`
- Database: PostgreSQL logs

---

**Time to Setup:** 5-10 minutes  
**Time to Validate:** 2-3 minutes  
**Status:** Production Ready  

Ready to build amazing things! 🚀

