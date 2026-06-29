import React, { useEffect, useState } from 'react';
import { StabilityResponse } from '../../cic-runtime/sandbox-exec/api-types';

interface StabilityState {
  data: StabilityResponse | null;
  loading: boolean;
  error: string | null;
}

export function StabilityV3Panel({ modelId }: { modelId: string }) {
  const [state, setState] = useState<StabilityState>({ data: null, loading: true, error: null });

  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    fetch(`/api/v3/stability/${modelId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: StabilityResponse) => setState({ data, loading: false, error: null }))
      .catch(err => setState({ data: null, loading: false, error: err.message }));
  }, [modelId]);

  if (state.loading) return <div className="p-4 border border-gray-700 rounded bg-gray-800" role="status" aria-live="polite">Loading drift stats...</div>;
  if (state.error) return <div className="p-4 border border-red-700 rounded bg-gray-800 text-red-400" role="alert">Error: {state.error}</div>;
  if (!state.data) return <div className="p-4 border border-gray-700 rounded bg-gray-800 text-gray-400">No stability data available</div>;

  const levelColor = state.data.level === 'high' ? 'text-red-500' : state.data.level === 'medium' ? 'text-yellow-500' : 'text-green-500';

  return (
    <section className="p-4 border border-gray-700 rounded bg-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-orange-400">Drift V3 Scoring (ONNX)</h2>
      <div className="bg-black p-4 rounded text-center mb-4">
        <div className="text-sm text-gray-400">Average Cosine Drift (24h)</div>
        <div className="text-3xl font-mono text-orange-500">{state.data.avgScore.toFixed(4)}</div>
        <div className="text-xs text-gray-500 mt-1">Thresholds: low ≤0.20, medium ≤0.30, high &gt;0.30</div>
      </div>
      <div className="text-sm text-gray-300">
        Status: <span className={`font-bold uppercase tracking-wide ${levelColor}`}>{state.data.level}</span>
      </div>
    </section>
  );
}
