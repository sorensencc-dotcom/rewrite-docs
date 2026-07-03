// ui-dashboard.tsx - React dashboard for CIC operator surface
import React, { useState, useEffect } from "react";

const ROADMAP_URL = process.env.REACT_APP_ROADMAP_URL || "http://localhost:3114";
const HARVESTER_URL = process.env.REACT_APP_HARVESTER_URL || "http://localhost:4000";
const INGESTION_URL = process.env.REACT_APP_INGESTION_URL || "http://localhost:3116";
const CODEFLOW_URL = process.env.REACT_APP_CODEFLOW_URL || "http://localhost:3112";

interface ExternalEvent {
  id: string;
  repo: string;
  commit: string;
  impact_tags: string[];
  roadmap_items: number;
  docker_build: "pending" | "running" | "success" | "failed";
  timestamp: string;
}

interface ExtractorResult {
  repoId: string;
  duration_ms: number;
  extracted: {
    nodes: number;
    edges: number;
    security: number;
    patterns: number;
    impact: number;
  };
}

interface RoadmapItem {
  id: string;
  type: "todo" | "idea";
  title: string;
  priority: "high" | "medium" | "low";
  status: string;
  source: string;
  repo?: string;
  commit_sha?: string;
  tags: string[];
}

// ============================================================================
// EXTERNAL REPO UPDATES DASHBOARD
// ============================================================================

export function ExternalRepoUpdatesDashboard() {
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    repo: "",
    impactType: ""
  });

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000); // Refresh every 5s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.repo, filters.impactType]);

  async function fetchEvents() {
    try {
      const params = new URLSearchParams();
      if (filters.repo) params.set("repo", filters.repo);
      if (filters.impactType) params.set("impact_type", filters.impactType);
      const res = await fetch(`${INGESTION_URL}/autonomy/signals?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Signals API returns { signals: [...] }; map to ExternalEvent shape
      const mapped: ExternalEvent[] = (data.signals ?? data ?? []).map((s: any) => ({
        id: s.id ?? s.signal_id ?? String(Math.random()),
        repo: s.source ?? s.repo ?? "unknown",
        commit: s.commit_sha ?? s.metadata?.commit ?? "",
        impact_tags: s.impact_tags ?? s.tags ?? [],
        roadmap_items: s.roadmap_items ?? s.metadata?.roadmap_items ?? 0,
        docker_build: s.docker_build ?? s.metadata?.docker_build ?? "pending",
        timestamp: s.timestamp ?? s.created_at ?? new Date().toISOString(),
      }));
      setEvents(mapped);
      setLoading(false);
    } catch (e) {
      console.error("Failed to fetch events:", e);
      setLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <h2>External Repo Updates</h2>

      <div className="filters">
        <label>
          Repo:
          <select
            value={filters.repo}
            onChange={(e) => setFilters({ ...filters, repo: e.target.value })}
          >
            <option value="">All</option>
            <option value="codeflow">CodeFlow</option>
          </select>
        </label>

        <label>
          Impact Type:
          <select
            value={filters.impactType}
            onChange={(e) => setFilters({ ...filters, impactType: e.target.value })}
          >
            <option value="">All</option>
            <option value="mandatory_update">Mandatory Update</option>
            <option value="workflow_improvement">Workflow Improvement</option>
            <option value="roadmap_idea">Roadmap Idea</option>
          </select>
        </label>
      </div>

      <table className="events-table">
        <thead>
          <tr>
            <th>Repo</th>
            <th>Commit</th>
            <th>Impact Tags</th>
            <th>Roadmap Items</th>
            <th>Docker Build</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6}>Loading...</td>
            </tr>
          ) : events.length === 0 ? (
            <tr>
              <td colSpan={6}>No events found</td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.id}>
                <td>
                  <code>{event.repo}</code>
                </td>
                <td>
                  <code>{event.commit.substring(0, 8)}</code>
                </td>
                <td>
                  {event.impact_tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </td>
                <td>{event.roadmap_items}</td>
                <td>
                  <span className={`status ${event.docker_build}`}>{event.docker_build}</span>
                </td>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// EXTRACTOR DETAIL TABS — backed by codeflow-server /analyze/:type
// ============================================================================

function SecurityFindingsTab({ repoId, total }: { repoId: string; total: number }) {
  const [findings, setFindings] = React.useState<any[]>([]);
  useEffect(() => {
    fetch(`${CODEFLOW_URL}/analyze/security?repo=${encodeURIComponent(repoId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setFindings(d.findings ?? d ?? []))
      .catch(() => setFindings([]));
  }, [repoId]);
  return (
    <div>
      <h3>Security Findings ({total})</h3>
      {findings.length === 0 ? (
        <p>No findings returned from analysis.</p>
      ) : (
        <table className="items-table">
          <thead>
            <tr><th>Severity</th><th>Rule</th><th>File</th><th>Line</th></tr>
          </thead>
          <tbody>
            {findings.map((f, i) => (
              <tr key={i}>
                <td><span className={`priority ${f.severity}`}>{f.severity}</span></td>
                <td>{f.rule ?? f.id}</td>
                <td><code>{f.file}</code></td>
                <td>{f.line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CodePatternsTab({ repoId, total }: { repoId: string; total: number }) {
  const [patterns, setPatterns] = React.useState<any[]>([]);
  useEffect(() => {
    fetch(`${CODEFLOW_URL}/analyze/patterns?repo=${encodeURIComponent(repoId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setPatterns(d.patterns ?? d ?? []))
      .catch(() => setPatterns([]));
  }, [repoId]);
  return (
    <div>
      <h3>Code Patterns ({total})</h3>
      {patterns.length === 0 ? (
        <p>No patterns returned from analysis.</p>
      ) : (
        <table className="items-table">
          <thead>
            <tr><th>Pattern</th><th>Count</th><th>Files</th></tr>
          </thead>
          <tbody>
            {patterns.map((p, i) => (
              <tr key={i}>
                <td>{p.name ?? p.pattern}</td>
                <td>{p.count ?? 1}</td>
                <td><code>{(p.files ?? []).join(", ")}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BlastRadiusTab({ repoId, total }: { repoId: string; total: number }) {
  const [entries, setEntries] = React.useState<any[]>([]);
  useEffect(() => {
    fetch(`${CODEFLOW_URL}/analyze/impact?repo=${encodeURIComponent(repoId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setEntries(d.entries ?? d ?? []))
      .catch(() => setEntries([]));
  }, [repoId]);
  return (
    <div>
      <h3>Blast Radius Analysis ({total})</h3>
      {entries.length === 0 ? (
        <p>No impact entries returned from analysis.</p>
      ) : (
        <table className="items-table">
          <thead>
            <tr><th>Changed File</th><th>Affected Files</th><th>Impact Score</th></tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td><code>{e.file ?? e.source}</code></td>
                <td>{e.affected_count ?? (e.affected ?? []).length}</td>
                <td>{e.score ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================================
// EXTRACTOR RESULTS VIEW
// ============================================================================

export function ExtractorResultsView({ repoId }: { repoId: string }) {
  const [result, setResult] = useState<ExtractorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    fetchResult();
  }, [repoId]);

  async function fetchResult() {
    try {
      const res = await fetch(`${CODEFLOW_URL}/analyze?repo=${encodeURIComponent(repoId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // codeflow-server /analyze returns { repoId, duration_ms, nodes, edges, security, patterns, impact }
      setResult({
        repoId: data.repoId ?? repoId,
        duration_ms: data.duration_ms ?? 0,
        extracted: {
          nodes: data.nodes ?? data.extracted?.nodes ?? 0,
          edges: data.edges ?? data.extracted?.edges ?? 0,
          security: data.security ?? data.extracted?.security ?? 0,
          patterns: data.patterns ?? data.extracted?.patterns ?? 0,
          impact: data.impact ?? data.extracted?.impact ?? 0,
        },
      });
      setLoading(false);
    } catch (e) {
      console.error("Failed to fetch result:", e);
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!result) return <div>No results found</div>;

  return (
    <div className="extractor-view">
      <h2>Extractor Results: {repoId}</h2>

      <div className="header">
        <div className="stat">
          <div className="value">{result.extracted.nodes}</div>
          <div className="label">Nodes</div>
        </div>
        <div className="stat">
          <div className="value">{result.extracted.edges}</div>
          <div className="label">Edges</div>
        </div>
        <div className="stat">
          <div className="value">{result.extracted.security}</div>
          <div className="label">Security Issues</div>
        </div>
        <div className="stat">
          <div className="value">{result.extracted.patterns}</div>
          <div className="label">Patterns</div>
        </div>
        <div className="stat">
          <div className="value">{result.extracted.impact}</div>
          <div className="label">Impact Entries</div>
        </div>
        <div className="stat">
          <div className="value">{result.duration_ms}ms</div>
          <div className="label">Duration</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "summary" ? "active" : ""}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </button>
        <button
          className={activeTab === "security" ? "active" : ""}
          onClick={() => setActiveTab("security")}
        >
          Security ({result.extracted.security})
        </button>
        <button
          className={activeTab === "patterns" ? "active" : ""}
          onClick={() => setActiveTab("patterns")}
        >
          Patterns ({result.extracted.patterns})
        </button>
        <button
          className={activeTab === "impact" ? "active" : ""}
          onClick={() => setActiveTab("impact")}
        >
          Impact ({result.extracted.impact})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "summary" && (
          <div>
            <h3>Analysis Summary</h3>
            <p>Extraction completed in {result.duration_ms}ms</p>
            <p>
              Analyzed {result.extracted.nodes} files with {result.extracted.edges} dependencies.
            </p>
            <p>
              Found {result.extracted.security} security issues and {result.extracted.patterns} code
              patterns.
            </p>
          </div>
        )}
        {activeTab === "security" && (
          <SecurityFindingsTab repoId={result.repoId} total={result.extracted.security} />
        )}
        {activeTab === "patterns" && (
          <CodePatternsTab repoId={result.repoId} total={result.extracted.patterns} />
        )}
        {activeTab === "impact" && (
          <BlastRadiusTab repoId={result.repoId} total={result.extracted.impact} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ROADMAP EXTERNAL ITEMS VIEW
// ============================================================================

export function RoadmapExternalItemsView() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    priority: "",
    repo: ""
  });

  // Fetch only when filters actually change; interval refreshes use current filter values
  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 10000); // Refresh every 10s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.priority, filters.repo]);

  async function fetchItems() {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set("type", filters.type);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.repo) params.set("repo", filters.repo);
      const res = await fetch(`${ROADMAP_URL}/roadmap/external-items?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // planning-engine returns { items: [...] } or raw array
      const raw: any[] = data.items ?? data ?? [];
      const mapped: RoadmapItem[] = raw.map((item: any) => ({
        id: item.id ?? String(Math.random()),
        type: item.type ?? "todo",
        title: item.title ?? item.description ?? "",
        priority: item.priority ?? "medium",
        status: item.status ?? "open",
        source: item.source ?? "external",
        repo: item.repo ?? item.source_repo,
        commit_sha: item.commit_sha,
        tags: item.tags ?? [],
      }));
      setItems(mapped);
      setLoading(false);
    } catch (e) {
      console.error("Failed to fetch items:", e);
      setLoading(false);
    }
  }

  const filteredItems = items.filter(
    (item) =>
      (!filters.type || item.type === filters.type) &&
      (!filters.priority || item.priority === filters.priority) &&
      (!filters.repo || item.repo === filters.repo)
  );

  return (
    <div className="roadmap-view">
      <h2>Roadmap – External Repo Items</h2>

      <div className="filters">
        <label>
          Type:
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All</option>
            <option value="todo">Todo</option>
            <option value="idea">Idea</option>
          </select>
        </label>

        <label>
          Priority:
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <label>
          Repo:
          <select value={filters.repo} onChange={(e) => setFilters({ ...filters, repo: e.target.value })}>
            <option value="">All</option>
            <option value="codeflow">CodeFlow</option>
          </select>
        </label>
      </div>

      <table className="items-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Repo</th>
            <th>Commit</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7}>Loading...</td>
            </tr>
          ) : filteredItems.length === 0 ? (
            <tr>
              <td colSpan={7}>No items found</td>
            </tr>
          ) : (
            filteredItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={`type ${item.type}`}>{item.type}</span>
                </td>
                <td>{item.title}</td>
                <td>
                  <span className={`priority ${item.priority}`}>{item.priority}</span>
                </td>
                <td>{item.status}</td>
                <td>
                  <code>{item.repo}</code>
                </td>
                <td>
                  <code>{item.commit_sha?.substring(0, 8)}</code>
                </td>
                <td>
                  {item.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// VECTOR SUBSYSTEM OBS DASHBOARD
// ============================================================================

interface VectorCollectionMetrics {
  collection: string;
  healthy: boolean;
  pointCount: number | null;
  indexStatus: string | null;
  lastSearchLatencyMs: number | null;
  lastIndexLatencyMs: number | null;
}

export function VectorMetricsDashboard() {
  const [metrics, setMetrics] = useState<{
    chunks: VectorCollectionMetrics;
    context: VectorCollectionMetrics;
    skills: VectorCollectionMetrics;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchMetrics() {
      try {
        const res = await fetch(`${INGESTION_URL}/vector/metrics`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (data.ok && active) {
          setMetrics(data);
          setError(null);
        } else if (active) {
          setError(data.error || "Failed to load metrics");
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="vector-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Vector Subsystem Health & Observability</h2>
        <span className={`status ${error ? 'failed' : 'success'}`}>
          {error ? `Offline: ${error}` : 'Connected'}
        </span>
      </div>

      {metrics && (
        <div className="header">
          {Object.entries(metrics).map(([key, m]) => (
            <div key={key} className="stat" style={{ borderLeft: `4px solid ${m.healthy ? '#10B981' : '#EF4444'}`, textAlign: 'left', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'capitalize', color: '#111827' }}>
                  {key} ({m.collection})
                </span>
                <span className={`status ${m.healthy ? 'success' : 'failed'}`}>
                  {m.healthy ? 'HEALTHY' : 'DOWN'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Points Count</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
                    {m.pointCount !== null ? m.pointCount.toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Indexing Status</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937', textTransform: 'capitalize' }}>
                    {m.indexStatus || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Search Latency</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
                    {m.lastSearchLatencyMs !== null ? `${m.lastSearchLatencyMs.toFixed(2)} ms` : 'No search yet'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Index Latency</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
                    {m.lastIndexLatencyMs !== null ? `${m.lastIndexLatencyMs.toFixed(2)} ms` : 'No index yet'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [view, setView] = useState<"external-updates" | "extractor" | "roadmap" | "vector">("external-updates");

  return (
    <div className="app">
      <header>
        <h1>CIC Operator Console</h1>
        <nav>
          <button
            className={view === "external-updates" ? "active" : ""}
            onClick={() => setView("external-updates")}
          >
            External Repo Updates
          </button>
          <button
            className={view === "extractor" ? "active" : ""}
            onClick={() => setView("extractor")}
          >
            Extractor Results
          </button>
          <button
            className={view === "roadmap" ? "active" : ""}
            onClick={() => setView("roadmap")}
          >
            Roadmap Items
          </button>
          <button
            className={view === "vector" ? "active" : ""}
            onClick={() => setView("vector")}
          >
            Vector Metrics
          </button>
        </nav>
      </header>

      <main>
        {view === "external-updates" && <ExternalRepoUpdatesDashboard />}
        {view === "extractor" && <ExtractorResultsView repoId="codeflow" />}
        {view === "roadmap" && <RoadmapExternalItemsView />}
        {view === "vector" && <VectorMetricsDashboard />}
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #f5f5f5;
          color: #333;
        }

        .app {
          min-height: 100vh;
        }

        header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h1 {
          margin-bottom: 20px;
          font-size: 28px;
        }

        nav {
          display: flex;
          gap: 10px;
        }

        nav button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        nav button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        nav button.active {
          background: white;
          color: #667eea;
          font-weight: 600;
        }

        main {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard,
        .extractor-view,
        .roadmap-view {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #333;
        }

        h3 {
          font-size: 18px;
          margin-bottom: 12px;
          color: #555;
        }

        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .filters label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th {
          background: #f9f9f9;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #ddd;
          font-weight: 600;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        tr:hover {
          background: #f9f9f9;
        }

        code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: "Monaco", "Courier New", monospace;
          font-size: 12px;
        }

        .tag {
          display: inline-block;
          background: #e0e7ff;
          color: #667eea;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          margin-right: 4px;
        }

        .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
        }

        .status.success {
          background: #d4edda;
          color: #155724;
        }

        .status.running {
          background: #fff3cd;
          color: #856404;
        }

        .status.pending {
          background: #e2e3e5;
          color: #383d41;
        }

        .status.failed {
          background: #f8d7da;
          color: #721c24;
        }

        .type {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
        }

        .type.todo {
          background: #d4edda;
          color: #155724;
        }

        .type.idea {
          background: #d1ecf1;
          color: #0c5460;
        }

        .priority {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
        }

        .priority.high {
          background: #f8d7da;
          color: #721c24;
        }

        .priority.medium {
          background: #fff3cd;
          color: #856404;
        }

        .priority.low {
          background: #d1ecf1;
          color: #0c5460;
        }

        .header {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #eee;
        }

        .stat .value {
          font-size: 32px;
          font-weight: 700;
          color: #667eea;
        }

        .stat .label {
          font-size: 12px;
          color: #999;
          margin-top: 8px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 2px solid #eee;
        }

        .tabs button {
          background: none;
          border: none;
          padding: 12px 16px;
          cursor: pointer;
          font-size: 14px;
          color: #999;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tabs button:hover {
          color: #667eea;
        }

        .tabs button.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab-content {
          padding: 16px 0;
        }
      `}</style>
    </div>
  );
}
