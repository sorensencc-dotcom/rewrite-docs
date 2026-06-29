import React, { useEffect, useState } from 'react';
import { LatencyResponse } from '../../cic-runtime/sandbox-exec/api-types';

interface LatencyState {
  data: LatencyResponse | null;
  loading: boolean;
  error: string | null;
}

export function LatencySloPanel({ runId }: { runId: string }) {
  const [state, setState] = useState<LatencyState>({ data: null, loading: true, error: null });

  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    fetch(`/api/v3/latency/${runId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: LatencyResponse) => setState({ data, loading: false, error: null }))
      .catch(err => setState({ data: null, loading: false, error: err.message }));
  }, [runId]);

  if (state.loading) return <div className="p-4 border border-gray-700 rounded bg-gray-800" role="status" aria-live="polite">Loading latency...</div>;
  if (state.error) return <div className="p-4 border border-red-700 rounded bg-gray-800 text-red-400" role="alert">Error: {state.error}</div>;
  if (!state.data) return <div className="p-4 border border-gray-700 rounded bg-gray-800 text-gray-400">No latency data available</div>;

  return (
    <section className="p-4 border border-gray-700 rounded bg-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-red-400">Latency & SLO Enforcement</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black p-4 rounded text-center">
          <div className="text-sm text-gray-400">Execution Latency</div>
          <div className="text-2xl font-mono text-white">{state.data.latencyMs} ms</div>
        </div>
        <div className="bg-black p-4 rounded text-center">
          <div className="text-sm text-gray-400">SLO Status</div>
          <div
            className={`text-2xl font-bold ${state.data.sloViolated ? 'text-red-500' : 'text-green-500'}`}
            role="status"
            aria-label={state.data.sloViolated ? 'SLO violated' : 'SLO passed'}
          >
            {state.data.sloViolated ? 'VIOLATED' : 'PASS'}
          </div>
        </div>
      </div>
    </section>
  );
}
