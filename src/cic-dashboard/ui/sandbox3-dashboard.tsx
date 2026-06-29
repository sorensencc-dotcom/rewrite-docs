import React from 'react';
import { TraceViewerPanel } from './trace-viewer-panel';
import { LatencySloPanel } from './latency-slo-panel';
import { ReproducibilityPanel } from './reproducibility-panel';
import { StabilityV3Panel } from './stability-v3-panel';

export function Sandbox3Dashboard({ runId, modelId }: { runId: string, modelId: string }) {
  return (
    <main className="p-6 bg-gray-900 text-white min-h-screen">
      <header className="mb-8" role="banner">
        <h1 className="text-3xl font-bold text-blue-400">Sandbox-3 Operator Dashboard</h1>
        <div className="text-gray-400 mt-2" role="contentinfo">
          Run ID: <code>{runId}</code> | Model: <code>{modelId}</code> | Tier: S3 (Firecracker)
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="region" aria-label="sandbox-3 metrics">
        <LatencySloPanel runId={runId} />
        <ReproducibilityPanel runId={runId} />
        <StabilityV3Panel modelId={modelId} />
        <TraceViewerPanel runId={runId} />
      </div>
    </main>
  );
}
