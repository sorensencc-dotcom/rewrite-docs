// src/harness/comparisonHarness.ts
import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";
import { cloudProviders } from "../server/cloudProviders.js";
import { CloudChatResponse } from "../providers/cloudProviderBase.js";

export interface ComparisonResult {
  model: string;
  prompt: string;
  response: string;
  latencyMs: number;
  tokens: number;
  error?: string;
  timestamp: string;
}

export interface ComparisonReport {
  runId: string;
  timestamp: string;
  models: string[];
  prompts: string[];
  results: ComparisonResult[];
  summary: {
    totalRuns: number;
    successCount: number;
    errorCount: number;
    avgLatencyMs: number;
    avgTokens: number;
  };
}

export class ComparisonHarness {
  private prompts: string[] = [
    "Explain domestic AI chips and their impact on training throughput.",
    "Summarize tradeoffs between domestic accelerators and NVIDIA H100.",
    "Describe hardware-software co-optimization for inference latency.",
    "List advantages of open-source LLMs vs proprietary models.",
    "Explain quantization and its impact on model size and speed.",
  ];

  async runComparison(
    models: string[],
    prompts?: string[]
  ): Promise<ComparisonReport> {
    const testPrompts = prompts || this.prompts;
    const runId = `comparison-${Date.now()}`;
    const results: ComparisonResult[] = [];
    let successCount = 0;

    for (const model of models) {
      for (const prompt of testPrompts) {
        const result = await this.runSingleTest(model, prompt);
        results.push(result);
        if (!result.error) {
          successCount++;
        }
      }
    }

    const successResults = results.filter((r) => !r.error);
    const avgLatencyMs =
      successResults.length > 0
        ? successResults.reduce((sum, r) => sum + r.latencyMs, 0) /
          successResults.length
        : 0;
    const avgTokens =
      successResults.length > 0
        ? successResults.reduce((sum, r) => sum + r.tokens, 0) /
          successResults.length
        : 0;

    return {
      runId,
      timestamp: new Date().toISOString(),
      models,
      prompts: testPrompts,
      results,
      summary: {
        totalRuns: results.length,
        successCount,
        errorCount: results.length - successCount,
        avgLatencyMs: Math.round(avgLatencyMs * 10) / 10,
        avgTokens: Math.round(avgTokens),
      },
    };
  }

  private async runSingleTest(
    model: string,
    prompt: string
  ): Promise<ComparisonResult> {
    const timestamp = new Date().toISOString();

    try {
      const modelPrefix = model.split(":")[0];
      const provider = cloudProviders[modelPrefix];

      if (!provider) {
        return {
          model,
          prompt,
          response: "",
          latencyMs: 0,
          tokens: 0,
          error: `Unknown provider: ${modelPrefix}`,
          timestamp,
        };
      }

      const req: UnifiedChatRequest = {
        model,
        input: prompt,
        stream: false,
        temperature: 0.0,
      };

      const response: CloudChatResponse = await provider.chat(req);

      return {
        model,
        prompt,
        response: response.text,
        latencyMs: response.latencyMs,
        tokens: response.tokens,
        timestamp,
      };
    } catch (error: any) {
      return {
        model,
        prompt,
        response: "",
        latencyMs: 0,
        tokens: 0,
        error: error?.message || "Unknown error",
        timestamp,
      };
    }
  }

  async saveReport(
    report: ComparisonReport,
    dir: string
  ): Promise<{ path: string; report: ComparisonReport }> {
    const path = `${dir}/report-${report.runId}.json`;
    const content = JSON.stringify(report, null, 2);

    // Write to file system (caller must implement actual file I/O)
    // This is a stub that returns the report and path
    return { path, report };
  }

  getDefaultPrompts(): string[] {
    return this.prompts;
  }

  setCustomPrompts(prompts: string[]): void {
    this.prompts = prompts;
  }
}
