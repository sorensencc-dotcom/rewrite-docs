// src/utils/fetchWithAuth.ts
import { config } from "../config.js";
import { generateMockOidcToken } from "./mockOidc.js";

async function getRealToken(tokenUrl?: string) {
  const url = tokenUrl || config.bookstack.oidc.tokenUrl;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.bookstack.oidc.clientId,
      client_secret: config.bookstack.oidc.clientSecret,
      scope: "bookstack",
    }),
  });

  if (!resp.ok) throw new Error(`OIDC token error: ${resp.status}`);
  const json = await resp.json() as any;
  return json.access_token;
}

export async function fetchWithAuth(path: string, payload: any, options: any = {}) {
  if (options.mock) {
    // If mock mode is true, simulate the responses directly in fetchWithAuth
    return simulateMockResponse(path, payload);
  }

  const token = await getRealToken(options.tokenUrl);

  const isGet = path.includes('page.get') || path.includes('search') || path.includes('health');
  const method = isGet ? 'GET' : 'POST';
  
  const baseUrl = options.baseUrl || config.bookstack.baseUrl;
  let url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (isGet) {
    if (payload && Object.keys(payload).length > 0) {
      const params = new URLSearchParams();
      for (const key of Object.keys(payload)) {
        if (payload[key] !== undefined && payload[key] !== null) {
          params.append(key, String(payload[key]));
        }
      }
      url += `?${params.toString()}`;
    }
  } else {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(payload);
  }

  const resp = await fetch(url, fetchOptions);

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`BookStack error ${resp.status}: ${text}`);
  }

  return resp.json();
}

function simulateMockResponse(path: string, payload: any): any {
  if (path.includes('shelf.upsert')) {
    return { id: payload.shelf_id, status: "updated", version: 1 };
  }
  if (path.includes('book.upsert')) {
    return { id: payload.book_id, status: "updated", version: 1 };
  }
  if (path.includes('chapter.upsert')) {
    return { id: payload.chapter_id, status: "updated", version: 1 };
  }
  if (path.includes('page.upsert')) {
    return { id: payload.page_id, status: "updated", version: 1 };
  }
  if (path.includes('page.get')) {
    return {
      page_id: payload.page_id || 'Artifact-sop',
      title: "Mocked Page Title",
      content: "Hello world mock page content",
      metadata: {
        phase: 27,
        component: "TestComponent",
        artifact_type: "sop",
        commit: "abc123",
        timestamp: "2026-06-21T22:31:00Z"
      }
    };
  }
  if (path.includes('search')) {
    return {
      query: payload.q || '',
      results: [
        {
          page_id: 'Artifact-sop',
          title: 'Mocked Search Result Page',
          content: 'Hello world match text for query: ' + (payload.q || ''),
          metadata: {
            phase: 27,
            component: "TestComponent",
            artifact_type: "sop",
            commit: "abc123",
            timestamp: "2026-06-21T22:31:00Z"
          }
        }
      ]
    };
  }
  if (path.includes('health')) {
    return { status: "ok", details: {} };
  }
  throw new Error(`Mock not implemented for path: ${path}`);
}
