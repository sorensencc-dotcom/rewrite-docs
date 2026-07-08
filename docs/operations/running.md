# Running CIC Services

Quick reference for starting and monitoring local CIC services.

## Starting the Cluster

```bash
docker-compose up -d
# Starts: MCP server (port 3100), CIC ingestion (port 3000)
```

## Health Checks

- MCP: `curl http://localhost:3100/health`
- Ingestion: `curl http://localhost:3000/health`

## Logs

```bash
docker-compose logs -f cic-ingestion
docker-compose logs -f cic-mcp
```

Referenced by:
- `reference/cli.md`
- `cic/index.md`

---

**Full runbook:** See [operations/runbook.md](./runbook.md)
