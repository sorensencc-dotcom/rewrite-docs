# Sealing & Verification

CIC ingestion sealing: locking the state, creating audit trail, verifying integrity.

## Sealing Process

1. **Pre-seal audit:** Validate all records in current ingestion
2. **Seal:** Lock ingestion state, record hash
3. **Verify:** Cross-check against stored hash

## CLI

```bash
cic-cli seal --phase=27
cic-cli verify --phase=27
```

## Autonomy Mode

When sealed, the autonomy API cannot modify locked records.

Referenced by:
- `reference/cli.md`
- `api/seal-verify.md`

---

**See also:** [Autonomy API](../api/autonomy.md)
