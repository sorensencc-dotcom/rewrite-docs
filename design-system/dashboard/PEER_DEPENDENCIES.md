# TanStack Query Dashboard — Peer Dependencies

## Required Packages

Install these in your React project to use the dashboard:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools react react-dom
```

## package.json

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "react": "^18.x",
    "react-dom": "^18.x"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x"
  }
}
```

## TypeScript Setup

Ensure tsconfig.json has:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## Usage

### Basic Setup

```tsx
import React from "react";
import { DashboardWithProvider } from "./design-system/dashboard";

export function App() {
  return <DashboardWithProvider />;
}
```

### With DevTools

```tsx
import { DashboardWithProvider } from "./design-system/dashboard";
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

## Backend API Integration

**Current state:** All hooks use mock data.

To connect to real backend:

1. Update `hooks/*.ts` files with actual API endpoints:

```typescript
async function fetchAgentsList(): Promise<Agent[]> {
  const res = await fetch("/api/agents/list");
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}
```

2. Set environment variable for WebSocket URL:

```bash
REACT_APP_WS_URL=wss://your-api.com/ws
```

3. Implement backend event handlers for WebSocket messages

## Vite Integration

If using Vite dev server:

```typescript
// vite.config.ts
export default {
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
};
```

## Testing

Install testing dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

Test setup:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createWrapper = () => {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

test("example", () => {
  const { result } = renderHook(() => useAgentsList(), {
    wrapper: createWrapper(),
  });
  // assertions...
});
```

## Performance Notes

- **Bundle size:** @tanstack/react-query is ~40KB gzipped
- **No breaking changes:** Works with React 18+
- **Backwards compatible:** Can coexist with Redux, Zustand, etc.

## Troubleshooting

### "QueryClient not found" error

Make sure `DashboardWithProvider` wraps your app:

```tsx
<DashboardWithProvider>
  {/* Your components */}
</DashboardWithProvider>
```

### WebSocket connection errors

Check that `REACT_APP_WS_URL` environment variable is set:

```bash
REACT_APP_WS_URL=wss://localhost:3000/ws npm run dev
```

### Stale data warnings

If you see "Detected Duplicate Atom Key" warnings, ensure queryKey is unique:

```typescript
// ✗ Bad
queryKey: ["data"]

// ✓ Good
queryKey: ["agents", "list", agentId]
```

---

**Dashboard ready for frontend integration.**
