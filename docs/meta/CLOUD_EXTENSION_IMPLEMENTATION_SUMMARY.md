---
title: "CLOUD EXTENSION IMPLEMENTATION SUMMARY"
summary: "# Cloud Extension Layer — Implementation Summary"
created: "2026-07-03T19:43:45.813Z"
updated: "2026-07-03T19:43:45.813Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Cloud Extension Layer — Implementation Summary

**Status:** Code generation complete. Ready for integration.  
**Date:** 2026-07-01  
**Architecture:** Parallel cloud routing layer + sealed offline MAAL  
**Providers:** OpenRouter, HuggingFace, Groq, Together, DeepInfra, Meituan (stub)  
**Total files generated:** 15

---

## Files Generated

### Provider Base + Implementations (7 files)
```
src/providers/cloudProviderBase.ts           — Common types, fetch wrapper, auth validation
src/providers/openrouterProvider.ts          — OpenRouter provider (8 models)
src/providers/huggingfaceProvider.ts         — HuggingFace provider (6 models)
src/providers/groqProvider.ts                — Groq provider (4 models)
src/providers/togetherProvider.ts            — Together AI provider (5 models)
src/providers/deepinfraProvider.ts           — DeepInfra provider (4 models)
src/providers/meituanProvider.ts             — Meituan provider stub (1 model, deterministic test mode)
```

**Contract:** All providers implement:
```ts
interface Provider {
  name: string;
  models: string[];
  chat: (req: UnifiedChatRequest) => Promise<UnifiedChatResponse>;
}
```

### Cloud Provider Registry (1 file)
```
src/server/cloudProviders.ts                 — Central registry + helpers
```

**Exports:**
- `cloudProviders: Record<string, Provider>` — all 6 providers
- `getCloudProvider(name: string): Provider`
- `listCloudModels(enabledProviders?: string[]): string[]`
- `getCloudProviderNames(): string[]`

### Integration Tests (6 files)
```
src/tests/openrouter-integration.test.ts
src/tests/huggingface-integration.test.ts
src/tests/groq-integration.test.ts
src/tests/together-integration.test.ts
src/tests/deepinfra-integration.test.ts
src/tests/meituan-integration.test.ts
```

**Coverage per test:**
- Model listing ✓
- API key validation ✓
- Stub response (test mode) ✓
- Invalid model handling ✓
- Temperature normalization ✓
- Provider name validation ✓
- Deterministic behavior (Meituan only) ✓

Run all tests:
```bash
npm test -- src/tests/*-integration.test.ts
```

### ModelSpec Additions (1 file)
```
src/core/cloudModelSpecs.ts                  — 28 cloud models + metadata
```

**Action required:** Import and merge into existing modelSpec registry:
```ts
import { CLOUD_MODEL_SPECS } from "./cloudModelSpecs.js";

export const ALL_MODEL_SPECS = {
  ...EXISTING_SPECS,
  ...CLOUD_MODEL_SPECS,
};
```

**MUST integrate in Step 3 before Step 2** — gateway `listCloudModels()` depends on specs being loaded.

### Comparison Harness (1 file)
```
src/harness/comparisonHarness.ts             — Universal multi-model evaluation
```

**Usage (with configurable prompt count):**
```ts
const harness = new ComparisonHarness({
  promptCount: 5,  // Override default 5 prompts per model
  throttleMs: 1000, // Rate-limit between calls
});
const report = await harness.runComparison([
  "openrouter:llama3-8b",
  "groq:llama3-8b-8192",
  "meituan:meituan-llm-v1",
]);
```

**Output:**
```json
{
  "runId": "comparison-1719841...",
  "timestamp": "2026-07-01T...",
  "results": [
    {
      "model": "openrouter:llama3-8b",
      "prompt": "...",
      "response": "...",
      "latencyMs": 250,
      "tokens": 42
    }
  ],
  "summary": {
    "totalRuns": 15,
    "successCount": 15,
    "errorCount": 0,
    "avgLatencyMs": 267.3,
    "avgTokens": 38
  }
}
```

### Gateway Modifications (1 file - additions only)
```
src/server/adapterGatewayAPI-cloud-additions.ts  — Functions to merge into existing
```

**Additions to integrate:**

1. **New function:** `dispatchToCloud(providerName, req)`  
   Routes request to cloud provider via registry.

2. **New function:** `handleCloudDispatch(req): string | null`  
   Determines if request should use cloud. Checks `req.routing?.allowCloud` with null-safety guard.

3. **New function:** `getCloudProviderStatus(): Record<string, boolean>`  
   Returns auth status for all cloud providers. **Called at gateway startup** to validate all API keys are configured or in test mode.

4. **Modify:** `handleChat(req)`  
   Add cloud dispatch check before offline routing:
   ```ts
   const cloudProvider = handleCloudDispatch(req);
   if (cloudProvider) return dispatchToCloud(cloudProvider, req);
   // ... existing offline logic
   ```

5. **Modify:** `handleGetModels(allowCloud?: boolean)`  
   Add cloud models to response when `allowCloud=true`.

6. **Modify:** `handleHealth(allowCloud?: boolean)`  
   Add cloud provider auth status when `allowCloud=true`.

**Merge strategy:** Import cloud functions as named imports or manually copy all 6 functions into existing `adapterGatewayAPI.ts`. If `handleChat()` already exists, rename existing one to `handleOfflineChat()` and call from new `handleChat()` after cloud dispatch check.

---

## Integration Checklist

### Step 1: Copy provider files
```bash
cp src/providers/cloudProviderBase.ts c:\dev\src\providers\
cp src/providers/*Provider.ts c:\dev\src\providers\
cp src/server/cloudProviders.ts c:\dev\src\server\
```

### Step 2: Add ModelSpec entries (BEFORE gateway edits)
Edit `c:\dev\src\core\modelSpec.ts`:
- Add `"cloud-openai-compatible"` to `ModelType` union
- Import `CLOUD_MODEL_SPECS` from `./cloudModelSpecs.ts`
- Merge specs into registry:
  ```ts
  export const ALL_MODEL_SPECS = {
    ...EXISTING_SPECS,
    ...CLOUD_MODEL_SPECS,
  };
  ```

### Step 3: Integrate gateway modifications
Edit `c:\dev\src\server\adapterGatewayAPI.ts`:
- Add `import { CLOUD_MODEL_SPECS } from "../core/cloudModelSpecs.js";`
- Import cloud functions from `./adapterGatewayAPI-cloud-additions.ts` OR manually copy 6 functions
- Modify `handleChat()`: add cloud dispatch check before offline logic
- Modify `handleGetModels()`: add cloud models when `allowCloud=true`
- Modify `handleHealth()`: add cloud provider auth status when `allowCloud=true`
- Add startup validation: `const authStatus = getCloudProviderStatus();` (throws if any required key missing in prod)

### Step 4: Add validation to MAAL router
Edit `c:\dev\src\maal\router\maal-routing-policy.ts`:
- Add runtime guard at entry:
  ```ts
  if (req.routing?.allowCloud) {
    throw new Error("Cloud dispatch only at gateway layer, not in MAAL router");
  }
  ```
- Ensures cloud requests never enter offline routing.

### Step 5: Copy comparison harness
```bash
cp src/harness/comparisonHarness.ts c:\dev\src\harness\
```

### Step 6: Copy tests
```bash
cp src/tests/*-integration.test.ts c:\dev\src\tests\
```

### Step 7: Verify no conflicts
- Check that `BackendId` union in `maal-routing-policy.ts` is **untouched**
- Check that CIC drift baseline is **untouched**
- Cloud models should **only** be reachable via `allowCloud: true`
- Verify MAAL router rejects cloud dispatch requests at runtime

---

## Routing Isolation Rules (ENFORCED)

✓ **MAAL offline routing:** Unchanged. No `BackendId` additions.  
✓ **CIC drift:** Cloud outputs NOT included in drift baseline.  
✓ **Default fallback:** Cloud models unreachable without `allowCloud: true`.  
✓ **SLO contract:** Cloud dispatch bypasses MAAL's SLO optimization.  
✓ **Error isolation:** Cloud provider failure doesn't affect offline routing.  
✓ **MAAL guard:** Runtime check blocks cloud requests at router layer.

---

## Environment Variables

Add to `.env` or `.env.local`:

```bash
# Cloud Providers (Wave 1)
OPENROUTER_API_KEY=sk-or-...
HUGGINGFACE_API_KEY=hf_...
GROQ_API_KEY=gsk_...
TOGETHER_API_KEY=...
DEEPINFRA_API_KEY=...
MEITUAN_API_KEY=... (optional until real endpoint ships — test mode only)

# Test mode
NODE_ENV=development  # or "test"
MOCK_PROVIDERS=1      # Enable stubs when API keys absent
```

**Note:** Gateway startup will validate all required keys are present or skipped in test mode.

---

## Verification

### 1. Run all tests
```bash
npm test -- src/tests/*-integration.test.ts
```

Expected: **All PASS**

### 2. Test gateway in isolation
Use `$ADAPTER_GATEWAY_PORT` env var or default 3119:
```bash
ADAPTER_GATEWAY_PORT=3119 npm run start:adapter-gateway
```

Check endpoints:
- `GET /v1/models` → should NOT include cloud models (no `allowCloud` param)
- `GET /v1/models?allowCloud=true` → should include cloud models
- `GET /v1/health` → offline provider only
- `GET /v1/health?allowCloud=true` → includes cloud auth status

### 3. Test cloud dispatch
```bash
curl -X POST http://localhost:3119/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openrouter:llama3-8b",
    "input": "Test",
    "stream": false,
    "temperature": 0.0,
    "routing": {"allowCloud": true}
  }'
```

Expected: 200 response with model output (stub or real, depending on auth).

### 4. Test comparison harness with throttling
```bash
npx ts-node -e "
import { ComparisonHarness } from './src/harness/comparisonHarness.js';

const harness = new ComparisonHarness({
  promptCount: 3,    // Reduced for testing
  throttleMs: 500,   // Rate-limit between calls
});
const report = await harness.runComparison([
  'openrouter:llama3-8b',
  'groq:llama3-8b-8192',
  'meituan:meituan-llm-v1',
]);
console.log(JSON.stringify(report.summary, null, 2));
"
```

Expected: Report with 9 results (3 models × 3 prompts), all successful in test mode, no rate-limit errors.

### 5. Test MAAL guard
```bash
curl -X POST http://localhost:3118/v1/router \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openrouter:llama3-8b",
    "input": "Test",
    "routing": {"allowCloud": true}
  }'
```

Expected: **400 or 422** error — "Cloud dispatch only at gateway layer, not in MAAL router"

---

## Model Count

- OpenRouter: 8 models
- HuggingFace: 6 models
- Groq: 4 models
- Together: 5 models
- DeepInfra: 4 models
- Meituan: 1 model (stub, deterministic test mode until real endpoint ships)

**Total: 28 cloud models** across 6 providers.

---

## Key Architectural Decisions

1. **Separate provider files** — matches existing repo pattern, enables rapid onboarding
2. **Opt-in cloud dispatch** — `allowCloud: true` preserves offline seal
3. **Deterministic stub mode** — Meituan works in test mode without real API key; permanent test-only until real endpoint confirmed
4. **Native fetch** — no external HTTP client dependency
5. **Unified error handling** — throw on non-200, no silent fallbacks
6. **Provider-prefixed model IDs** — avoids collisions, enables model discovery
7. **Gateway-only cloud routing** — MAAL router rejects cloud requests at runtime to prevent accidental isolation breaks
8. **Null-safe routing checks** — `req.routing?.allowCloud` with guards against undefined routing object
9. **Configurable harness** — prompt count + throttle params prevent rate-limit hits in testing/benchmarking

---

## Future Extensibility

Adding a new cloud provider (e.g., Alibaba, ByteDance, Tencent):

1. Create `src/providers/alibabaProvider.ts` (implement `Provider` interface)
2. Add to `cloudProviders` object in `src/server/cloudProviders.ts` (1 line)
3. Add ModelSpec entries to `src/core/cloudModelSpecs.ts`
4. Create `src/tests/alibaba-integration.test.ts`
5. Done. No MAAL/CIC/gateway changes.

---

## Support

- **API errors:** Provider throws on non-200 responses
- **Auth errors:** Provider throws if auth key missing (prod) or returns stub (test); gateway startup validates all required keys
- **Null routing:** `handleCloudDispatch()` safely handles missing `routing` object
- **Timeout:** 30s default (15s for Groq, 60s for HuggingFace)
- **Temperature clamping:** All providers normalize to [0.0, 2.0]
- **Token counting:** HuggingFace/DeepInfra estimate if not provided
- **Rate limiting:** Comparison harness supports configurable throttle to avoid provider limits
- **MAAL guard:** Runtime check at router entry prevents cloud requests from entering offline routing

---

**Ready to integrate. No breaking changes to existing systems. All findings fixed.**
