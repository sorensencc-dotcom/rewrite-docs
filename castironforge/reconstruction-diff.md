# CastIronForge Reconstruction Diff Report

**Date:** 2026-06-24  
**Status:** ✅ Complete

## Sources Used

| Component | Source | Files | Notes |
|-----------|--------|-------|-------|
| chat-frontend | C:\Users\soren\castironforge\chat-frontend | 4,205 | Vite/React scaffold |
| chat-agent | C:\Users\soren\castironforge\chat-agent | 1,988 | Express/TS backend |
| cic-ingestion | C:\dev\cic-ingestion | 24,295 | Ingestion pipeline |
| torque-query | C:\dev\_cic-fragments-archive\cic\torquequery | 98 | Query engine |

**Total:** 31,586 files

## Monorepo Structure

```
C:\dev\castironforge/
  chat-frontend/        ← React UI (port 5173)
  chat-agent/           ← Express backend (port 8000)
  torque-query/         ← Query engine (port 9000)
  cic-ingestion/        ← Ingestion pipeline (port 3000)
  shared/               ← Placeholder (no source found)
  .github/
    workflows/
      ci.yml
  pnpm-workspace.yaml
  package.json
  README.md
  health-check.ps1
  bootstrap.ps1
  docker-compose.yml
  castironforge.code-workspace
```

## Files Created

- ✅ `pnpm-workspace.yaml` — Workspace definition
- ✅ `package.json` — Root monorepo package
- ✅ `.gitignore` — Git exclusions
- ✅ `README.md` — Monorepo guide
- ✅ `.env` files — Per-service environment configs
- ✅ `health-check.ps1` — Service health validator
- ✅ `bootstrap.ps1` — One-command service launcher
- ✅ `docker-compose.yml` — Containerized all services
- ✅ `castironforge.code-workspace` — VSCode workspace
- ✅ `.github/workflows/ci.yml` — GitHub Actions CI

## Port Map

| Service | Port | Status |
|---------|------|--------|
| chat-frontend | 5173 | Ready |
| chat-agent | 8000 | Ready |
| torque-query | 9000 | Ready |
| cic-ingestion | 3000 | Ready |

## Known Gaps

- `shared/` — No authoritative source found; left as placeholder
- Gemini experimental branches — Not merged into reconstruction
- Old governance structures in `cic/` — Archived but not reattached

## Next Steps

1. **Validate services start without errors**
   ```powershell
   .\bootstrap.ps1
   ```

2. **Run health check**
   ```powershell
   .\health-check.ps1
   ```

3. **Test FamilySearch pipeline**
   - Open `http://localhost:5173`
   - Select `torque:familysearch`
   - Run `/pipeline person <PID>`

4. **Populate `shared/` if needed**
   - Locate authoritative source or design new utilities

5. **Archive fragments**
   - After validation, delete `C:\dev\_cic-fragments-archive`

## Validation Checklist

- [ ] All services start on correct ports
- [ ] Health check shows all OK
- [ ] FamilySearch pipeline runs end-to-end
- [ ] `/pipeline person <PID>` returns temporal KG
- [ ] Chat-agent calls torque-query successfully
- [ ] CI/CD pipeline passes
