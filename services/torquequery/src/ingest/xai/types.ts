export type XaiDocsMcpAdapterConfig = {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
};

export type CicDocPage = {
  slug: string;
  title: string;
  content: string;
  url?: string;
};

export type CicSearchResult = {
  slug: string;
  title: string;
  snippet?: string;
};

export type CicMcpCallLineage = {
  endpoint: string;
  method: string;
  toolName?: string;
  arguments?: unknown;
  attempt: number;
  requestId: string;
};

export type CicMcpCallResult<T> = {
  data: T;
  lineage: CicMcpCallLineage;
};
