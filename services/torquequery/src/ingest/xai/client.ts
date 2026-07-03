import { XaiDocsMcpAdapterConfig, CicMcpCallResult } from "./types";

const XAI_DOCS_MCP_ENDPOINT = "https://docs.x.ai/api/mcp";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id: number | string;
};

type JsonRpcResponse<T = unknown> = {
  jsonrpc: "2.0";
  id: number | string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export class XaiMcpClient {
  private readonly config: Required<XaiDocsMcpAdapterConfig>;
  private requestCounter = 0;

  constructor(config?: XaiDocsMcpAdapterConfig) {
    this.config = {
      headers: config?.headers ?? {},
      timeoutMs: config?.timeoutMs ?? 8000,
      maxRetries: config?.maxRetries ?? 2,
    };
  }

  private nextRequestId(): string {
    this.requestCounter += 1;
    return `xai-mcp-${this.requestCounter}`;
  }

  private async callJsonRpc<T>(
    method: string,
    params: unknown,
    attempt: number,
    toolName?: string
  ): Promise<CicMcpCallResult<T>> {
    const requestId = this.nextRequestId();

    const body: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id: requestId,
    };

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs
    );

    let response: Response;
    try {
      response = await fetch(XAI_DOCS_MCP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          ...this.config.headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (attempt < this.config.maxRetries) {
        clearTimeout(timeout);
        return this.callJsonRpc<T>(method, params, attempt + 1, toolName);
      }
      throw new Error(`xAI Docs MCP connection failed: ${err.message || err}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const isRetryable = response.status >= 500 || response.status === 429;
      if (isRetryable && attempt < this.config.maxRetries) {
        return this.callJsonRpc<T>(method, params, attempt + 1, toolName);
      }
      throw new Error(
        `xAI Docs MCP HTTP error: ${response.status} ${response.statusText}`
      );
    }

    const json = (await response.json()) as JsonRpcResponse<T>;

    if (json.error) {
      const isRetryable =
        json.error.code === -32000 || json.error.code === -32001;
      if (isRetryable && attempt < this.config.maxRetries) {
        return this.callJsonRpc<T>(method, params, attempt + 1, toolName);
      }
      throw new Error(
        `xAI Docs MCP JSON-RPC error: ${json.error.code} ${json.error.message}`
      );
    }

    if (json.result === undefined) {
      throw new Error("xAI Docs MCP: missing result in JSON-RPC response");
    }

    return {
      data: json.result,
      lineage: {
        endpoint: XAI_DOCS_MCP_ENDPOINT,
        method,
        toolName,
        arguments: params,
        attempt,
        requestId,
      },
    };
  }

  async listPages(): Promise<CicMcpCallResult<any>> {
    return this.callJsonRpc<any>(
      "tools/call",
      { name: "list_doc_pages", arguments: {} },
      1,
      "list_doc_pages"
    );
  }

  async getPage(slug: string): Promise<CicMcpCallResult<any>> {
    return this.callJsonRpc<any>(
      "tools/call",
      { name: "get_doc_page", arguments: { slug } },
      1,
      "get_doc_page"
    );
  }

  async search(query: string, maxResults = 10): Promise<CicMcpCallResult<any>> {
    return this.callJsonRpc<any>(
      "tools/call",
      { name: "search_docs", arguments: { query, max_results: maxResults } },
      1,
      "search_docs"
    );
  }
}
