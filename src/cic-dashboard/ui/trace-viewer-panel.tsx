import React, { useEffect, useState } from 'react';
import { TracesResponse } from '../../cic-runtime/sandbox-exec/api-types';

interface TraceViewerState {
  data: TracesResponse | null;
  loading: boolean;
  error: string | null;
}

export function TraceViewerPanel({ runId }: { runId: string }) {
  const [state, setState] = useState<TraceViewerState>({ data: null, loading: true, error: null });

  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    fetch(`/api/v3/traces/${runId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: TracesResponse) => setState({ data, loading: false, error: null }))
      .catch(err => setState({ data: null, loading: false, error: err.message }));
  }, [runId]);

  if (state.loading) return <div className="p-4 border border-gray-700 rounded bg-gray-800" role="status" aria-live="polite">Loading traces...</div>;
  if (state.error) return <div className="p-4 border border-red-700 rounded bg-gray-800 text-red-400" role="alert">Error: {state.error}</div>;
  if (!state.data) return <div className="p-4 border border-gray-700 rounded bg-gray-800 text-gray-400">No trace data available</div>;

  return (
    <section className="p-4 border border-gray-700 rounded bg-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-purple-400">Execution Telemetry (eBPF/strace)</h2>
      <div className="space-y-4">
        <article>
          <h3 className="font-medium text-gray-300">Network Events ({state.data.networkTrace.length})</h3>
          <ul className="text-sm font-mono text-green-400 h-32 overflow-y-auto bg-black p-2 rounded" aria-label="network trace events">
            {state.data.networkTrace.length === 0 ? (
              <li className="text-gray-500">No network events</li>
            ) : (
              state.data.networkTrace.map((t, i) => (
                <li key={i}>{t.timestamp.substring(11, 19)} | {t.protocol} {t.dest_ip}:{t.dest_port} (Tx: {t.bytes_sent}B, Rx: {t.bytes_received}B)</li>
              ))
            )}
          </ul>
        </article>
        <article>
          <h3 className="font-medium text-gray-300">File Access Events ({state.data.fileAccess.length})</h3>
          <ul className="text-sm font-mono text-yellow-400 h-32 overflow-y-auto bg-black p-2 rounded" aria-label="file access events">
            {state.data.fileAccess.length === 0 ? (
              <li className="text-gray-500">No file access events</li>
            ) : (
              state.data.fileAccess.map((f, i) => (
                <li key={i}>{f.file} | Result: {f.result} {f.error_code ? `(${f.error_code})` : ''}</li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
