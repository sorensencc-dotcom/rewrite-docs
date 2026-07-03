# TanStack Query Integration (v1.0)

**Status:** Production-ready  
**Specification:** TANSTACK_QUERY_INTEGRATION.v1.0.0.md  
**Date:** 2026-06-21

## Overview

Unified reactive data layer for CIC's polling requirements using TanStack Query (React Query).

- **Automatic background refetching** — Keep UI fresh without stale data
- **Request deduplication** — Same query runs once, subscribers share result
- **WebSocket invalidation** — Real-time updates via event stream
- **Dependent queries** — Query B waits for Query A result
- **Infinite queries** — Streaming logs, pagination
- **Per-panel configuration** — Different intervals for different data

## Architecture

```
DashboardWithProvider (QueryClientProvider wrapper)
├── useWebSocketInvalidation (connection + event handlers)
├── <Dashboard content>
│   ├── AgentsPanel (uses useAgentsList + useAgentHealth)
│   ├── IngestionPanel (uses useIngestionQueue + useIngestionDLQ)
│   ├── DriftPanel (uses useDriftEvents + useDriftStats)
│   ├── MemoryPanel (uses useMemoryClusters)
│   └── PipelinesPanel (uses usePipelineRuns)
└── Design System Sections (Colors, Spacing, Typography, etc.)
```

## Query Configuration

### QueryClient Setup

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Don't refetch when tab regains focus
      retry: 2,                      // Retry failed queries 2x
      staleTime: 5000,               // Mark as stale after 5s
      gcTime: 60000,                 // Clean up unused queries after 60s
    },
  },
});
```

### Per-Panel Intervals

| Panel | Query | Interval | Purpose |
|-------|-------|----------|---------|
| Agents | agents.list | 5s | Primary control surface |
| Agents | agents.health | 3s | Health status |
| Ingestion | ingestion.queue | 3s | Queue depth tracking |
| Ingestion | ingestion.dlq | 10s | Dead letter queue |
| Drift | drift.events | 2s | Time-sensitive |
| Drift | drift.stats | 5s | Aggregates |
| Memory | memory.clusters | 10s | Slower changes |
| Pipelines | pipelines.runs | 5s | High-churn |
| Settings | settings.config | 30s | Rarely changed |

## Usage

### Mounting the Dashboard

```tsx
import { DashboardWithProvider } from "./design-system/dashboard";

export function App() {
  return (
    <div>
      <DashboardWithProvider />
    </div>
  );
}
```

### Using Query Hooks

```tsx
import { useAgentsList, useAgentHealth } from "./design-system/dashboard/hooks";

export function MyComponent() {
  // Single query
  const { data: agents, isLoading, error, refetch } = useAgentsList();

  // Multiple queries in parallel
  const results = useAgentsHealth(["agent-1", "agent-2"]);

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {agents?.map((agent) => (
        <div key={agent.id}>
          {agent.name} — {agent.status}
        </div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Custom Queries

Create a new hook in `hooks/useCustom.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";

async function fetchCustomData() {
  const res = await fetch("/api/custom");
  return res.json();
}

export function useCustomData() {
  return useQuery({
    queryKey: ["custom", "data"],
    queryFn: fetchCustomData,
    refetchInterval: 5000,  // 5s polling
  });
}
```

## WebSocket Invalidation

**File:** `hooks/useWebSocketInvalidation.ts`

Listens for server events and invalidates corresponding queries:

```typescript
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "agent:update":
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      break;
    case "drift:event":
      queryClient.invalidateQueries({ queryKey: ["drift", "events"] });
      queryClient.invalidateQueries({ queryKey: ["drift", "stats"] });
      break;
  }
};
```

### Event Types

- `agent:update` — Agent state changed
- `agent:health` — Agent health metrics updated
- `ingestion:queue` — Queue depth changed
- `ingestion:dlq` — DLQ event added
- `drift:event` — Token drift detected
- `memory:cluster` — Memory cluster updated
- `pipeline:update` — Pipeline status changed
- `settings:update` — Settings modified

## Query Patterns

### Dependent Queries

Enable second query only after first succeeds:

```typescript
const { data: agent } = useAgentsList();
const agentId = agent?.[0]?.id;

const { data: health } = useQuery({
  queryKey: ["agents", "health", agentId],
  queryFn: () => fetchAgentHealth(agentId),
  enabled: !!agentId,  // Wait for agent ID
});
```

### Parallel Queries

Fetch multiple items at once:

```typescript
const { data: results } = useQueries({
  queries: agentIds.map((id) => ({
    queryKey: ["agents", "health", id],
    queryFn: () => fetchAgentHealth(id),
  })),
});
```

### Infinite Queries

For pagination/streaming:

```typescript
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ["logs"],
  queryFn: ({ pageParam = 0 }) => fetchLogs(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

## Testing

### Unit Tests

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAgentsList } from "./hooks";

test("useAgentsList fetches agents", async () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useAgentsList(), { wrapper });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toHaveLength(3);
});
```

### Mocking Queries

```typescript
import { QueryClient, useQuery } from "@tanstack/react-query";

const mockQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

beforeEach(() => {
  mockQueryClient.setQueryData(["agents", "list"], [
    { id: "1", name: "Test Agent", status: "online" },
  ]);
});
```

## Production Deployment

### Environment Variables

```bash
REACT_APP_WS_URL=wss://api.cic.local/ws
```

### Scaling Tips

1. **Increase staleTime** for slower-changing data
2. **Decrease gcTime** to clean up memory faster
3. **Use refetchInterval instead of polling** — cleaner, backed by TanStack Query
4. **Implement request deduplication** — same query auto-dedupes
5. **Monitor query cache** — DevTools shows cache size and hit rates

### Performance Monitoring

Use TanStack Query DevTools:

```tsx
import { TanStackQueryDevtools } from "@tanstack/react-query-devtools";

export function App() {
  return (
    <>
      <DashboardWithProvider />
      <TanStackQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

## Files

### Hooks

- `hooks/useQueryClient.ts` — QueryClient factory
- `hooks/useAgents.ts` — Agent queries (5s, 3s)
- `hooks/useIngestion.ts` — Ingestion queries (3s, 10s)
- `hooks/useDrift.ts` — Drift queries (2s, 5s)
- `hooks/useMemory.ts` — Memory queries (10s)
- `hooks/usePipelines.ts` — Pipeline queries (5s)
- `hooks/useSettings.ts` — Settings queries (30s)
- `hooks/useWebSocketInvalidation.ts` — WebSocket → query invalidation
- `hooks/index.ts` — Barrel export

### Panels

- `sections/AgentsPanel.tsx` — Live agent status table
- `sections/IngestionPanel.tsx` — Queue depth + DLQ monitoring
- `sections/DriftPanel.tsx` — Drift events with severity
- `sections/MemoryPanel.tsx` — Vector cluster density
- `sections/PipelinesPanel.tsx` — Pipeline run status + progress
- `sections/index.ts` — Barrel export

### Wrapper

- `DashboardWithProvider.tsx` — QueryClientProvider + WebSocket hook

## Next Steps

1. ✅ QueryClient + hook factory complete
2. ✅ Per-panel queries implemented (5 panels)
3. ✅ WebSocket invalidation scaffold ready
4. ⏳ Backend API endpoints (mock → real)
5. ⏳ E2E tests (Playwright)
6. ⏳ Performance profiling (large datasets)
7. ⏳ Infinite queries for logs/streams

---

**Ready to integrate with backend services.**
