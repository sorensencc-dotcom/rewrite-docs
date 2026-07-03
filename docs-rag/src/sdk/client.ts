import { DocsRagAnswer } from "./types";

export interface TorqueQueryClientConfig {
  baseUrl: string;
  timeoutMs?: number;
}

export class TorqueQueryClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(cfg: TorqueQueryClientConfig) {
    this.baseUrl = cfg.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = cfg.timeoutMs ?? 30000;
  }

  /**
   * Resolves documentation queries using the local TorqueQuery subsystem.
   */
  async resolveDocs(question: string, taskLabels: string[] = []): Promise<DocsRagAnswer> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, taskLabels }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`TorqueQuery request failed with status: ${res.status}`);
      }

      return (await res.json()) as DocsRagAnswer;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Triggers the ingestion pipeline to refresh the knowledge index.
   */
  async triggerIngest(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${this.baseUrl}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      throw new Error(`TorqueQuery ingestion request failed with status: ${res.status}`);
    }

    return await res.json();
  }
}
