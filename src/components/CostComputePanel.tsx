import React, { useState, useEffect, forwardRef } from 'react';
import styles from './CostComputePanel.module.css';

interface UsageSummary {
  dailyTokens: number;
  dailyCost: number;
  weeklyTokens: number;
  weeklyCost: number;
  emaTokens: number;
  emaCost: number;
  byStage: Record<string, number>;
  byAgent: Record<string, { tokens: number; cost: number; savings?: number }>;
}

interface AgentBurn {
  [agent: string]: { tokens: number; cost: number };
}

interface LocalROI {
  dailySavings: number;
  weeklySavings: number;
  gpuCostPerDay: number;
  roi: number;
}

interface CostComputePanelProps {
  apiBaseUrl?: string;
}

export const CostComputePanel = forwardRef<HTMLDivElement, CostComputePanelProps>(
  ({ apiBaseUrl = 'http://localhost:3000' }, ref) => {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [agents, setAgents] = useState<AgentBurn>({});
  const [roi, setRoi] = useState<LocalROI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usageRes, agentsRes, roiRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/usage-summary`),
        fetch(`${apiBaseUrl}/api/agent-burn`),
        fetch(`${apiBaseUrl}/api/local-roi`),
      ]);

      if (!usageRes.ok || !agentsRes.ok || !roiRes.ok) {
        throw new Error('Failed to fetch cost data');
      }

      const usageData = await usageRes.json();
      const agentsData = await agentsRes.json();
      const roiData = await roiRes.json();

      setUsage(usageData);
      setAgents(agentsData);
      setRoi(roiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [apiBaseUrl]);


  if (loading && !usage) {
    return (
      <div className={styles.panel}>
        <p className={styles.loadingError}>Loading cost data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div ref={ref} className={styles.panel} role="region" aria-labelledby="cost-title" tabIndex={0}>
      {/* Usage & Cost (24h) Card */}
      <div className={styles.card}>
        <div id="cost-title" className={styles.header}>📊 Usage & Cost (24h)</div>
        <div className={styles.row}>
          <span className={styles.label}>Tokens</span>
          <span className={styles.value}>{usage?.dailyTokens.toLocaleString() || 0}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Cost (USD)</span>
          <span className={styles.value}>${usage?.dailyCost.toFixed(4) || '0.0000'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>EMA Cost (USD)</span>
          <span className={styles.value}>${usage?.emaCost.toFixed(4) || '0.0000'}</span>
        </div>
        {usage?.byStage && Object.keys(usage.byStage).length > 0 && (
          <div className={styles.stageSection}>
            <div className={`${styles.header} ${styles.headerSmall}`}>By Stage</div>
            {Object.entries(usage.byStage).map(([stage, tokens]) => (
              <div key={stage} className={styles.row}>
                <span className={styles.label}>{stage}</span>
                <span className={styles.value}>{tokens.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-Agent Burn Card */}
      <div className={styles.card}>
        <div className={styles.header}>🔥 Agent Burn (24h)</div>
        {Object.entries(agents).length > 0 ? (
          <div>
            {Object.entries(agents).map(([agent, data]) => (
              <div key={agent} className={styles.agentEntry}>
                <div className={`${styles.header} ${styles.headerSmall} ${styles.valueSecondary}`}>{agent}</div>
                <div className={styles.row}>
                  <span className={styles.label}>Tokens</span>
                  <span className={styles.value}>{data.tokens.toLocaleString()}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Cost (USD)</span>
                  <span className={styles.value}>${data.cost.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noActivity}>No agent activity</p>
        )}
      </div>

      {/* Local Model ROI Card */}
      <div className={styles.card}>
        <div className={styles.header}>💰 Local Model ROI</div>
        <div className={styles.row}>
          <span className={styles.label}>Daily Savings (USD)</span>
          <span className={styles.valuePrimary}>
            ${roi?.dailySavings.toFixed(4) || '0.0000'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>GPU Cost/Day (USD)</span>
          <span className={styles.value}>${roi?.gpuCostPerDay.toFixed(4) || '0.0000'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>ROI Multiplier</span>
          <span className={roi && roi.roi > 1 ? styles.valuePrimary : styles.roiNeutral}>
            {roi?.roi.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Last updated */}
      <div className={styles.lastUpdated}>
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
  }
);

CostComputePanel.displayName = 'CostComputePanel';

export default CostComputePanel;
