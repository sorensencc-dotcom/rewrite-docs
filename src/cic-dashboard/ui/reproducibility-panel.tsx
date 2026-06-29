import React, { useEffect, useState } from 'react';
import { ReproducibilityResponse } from '../../cic-runtime/sandbox-exec/api-types';

interface ReproState {
  data: ReproducibilityResponse | null;
  loading: boolean;
  error: string | null;
}

function truncateHash(hash: string, len: number = 16): string {
  return hash.length > len ? `${hash.substring(0, len)}...` : hash;
}

export function ReproducibilityPanel({ runId }: { runId: string }) {
  const [state, setState] = useState<ReproState>({ data: null, loading: true, error: null });

  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    fetch(`/api/v3/reproducibility/${runId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ReproducibilityResponse) => setState({ data, loading: false, error: null }))
      .catch(err => setState({ data: null, loading: false, error: err.message }));
  }, [runId]);

  if (state.loading) return <div className="p-4 border border-gray-700 rounded bg-gray-800" role="status" aria-live="polite">Loading repro metadata...</div>;
  if (state.error) return <div className="p-4 border border-red-700 rounded bg-gray-800 text-red-400" role="alert">Error: {state.error}</div>;
  if (!state.data) return <div className="p-4 border border-gray-700 rounded bg-gray-800 text-gray-400">No reproducibility data available</div>;

  return (
    <section className="p-4 border border-gray-700 rounded bg-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-cyan-400">Determinism & Hashes</h2>
      <ul className="space-y-2 text-sm font-mono">
        <li className="flex justify-between bg-black p-2 rounded" title={state.data.vmConfigHash}>
          <span className="text-gray-400">VM Config Hash:</span>
          <span className="text-green-400">{truncateHash(state.data.vmConfigHash)}</span>
        </li>
        <li className="flex justify-between bg-black p-2 rounded" title={state.data.envHash}>
          <span className="text-gray-400">Environment Hash:</span>
          <span className="text-green-400">{truncateHash(state.data.envHash)}</span>
        </li>
        <li className="flex justify-between bg-black p-2 rounded" title={state.data.fsHash}>
          <span className="text-gray-400">Filesystem Hash:</span>
          <span className="text-green-400">{truncateHash(state.data.fsHash)}</span>
        </li>
        <li className="flex justify-between bg-black p-2 rounded" title={state.data.snapshotHash}>
          <span className="text-gray-400">Memory Snapshot:</span>
          <span className="text-green-400">{truncateHash(state.data.snapshotHash)}</span>
        </li>
      </ul>
    </section>
  );
}
