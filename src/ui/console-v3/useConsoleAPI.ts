/**
 * useConsoleAPI - Hooks for ConsoleV3 data fetching
 * Polls health, pipelines, alerts from backend
 */

import { useState, useCallback, useRef } from 'react';

export interface HealthStatus {
  status: 'OK' | 'DEGRADED' | 'DOWN';
  serviceCount: number;
  timestamp: number;
}

export interface Pipeline {
  id: string;
  name: string;
  state: 'idle' | 'running' | 'paused' | 'failed';
  progress?: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

// API endpoints - configure via env or defaults
const HEALTH_ENDPOINT = process.env.REACT_APP_HEALTH_ENDPOINT || 'http://localhost:8000/console/health';
const PIPELINES_ENDPOINT = process.env.REACT_APP_PIPELINES_ENDPOINT || 'http://localhost:8000/console/pipelines';
const ALERTS_ENDPOINT = process.env.REACT_APP_ALERTS_ENDPOINT || 'http://localhost:8000/console/alerts';

export function useHealthStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.fetch(HEALTH_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Health fetch failed: ${response.status}`);
      }
      const data = await response.json();
      setHealth({
        status: data.status || 'OK',
        serviceCount: data.serviceCount || 0,
        timestamp: Date.now(),
      });
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { health, error, loading, fetch };
}

export function usePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.fetch(PIPELINES_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Pipelines fetch failed: ${response.status}`);
      }
      const data = await response.json();
      setPipelines(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { pipelines, error, loading, fetch };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.fetch(ALERTS_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Alerts fetch failed: ${response.status}`);
      }
      const data = await response.json();
      setAlerts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { alerts, error, loading, fetch };
}

/**
 * useConsolePolling - Convenience hook for all three polls with intervals
 */
export function useConsolePolling(intervals: { health?: number; pipelines?: number; alerts?: number } = {}) {
  const {
    health: healthData,
    fetch: fetchHealth,
  } = useHealthStatus();
  const {
    pipelines,
    fetch: fetchPipelines,
  } = usePipelines();
  const {
    alerts,
    fetch: fetchAlerts,
  } = useAlerts();

  const healthIntervalRef = useRef<NodeJS.Timeout>();
  const pipelinesIntervalRef = useRef<NodeJS.Timeout>();
  const alertsIntervalRef = useRef<NodeJS.Timeout>();

  const start = useCallback(() => {
    // Initial fetch
    fetchHealth();
    fetchPipelines();
    fetchAlerts();

    // Setup intervals
    healthIntervalRef.current = setInterval(fetchHealth, intervals.health ?? 10000);
    pipelinesIntervalRef.current = setInterval(fetchPipelines, intervals.pipelines ?? 5000);
    alertsIntervalRef.current = setInterval(fetchAlerts, intervals.alerts ?? 3000);

    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
      if (pipelinesIntervalRef.current) clearInterval(pipelinesIntervalRef.current);
      if (alertsIntervalRef.current) clearInterval(alertsIntervalRef.current);
    };
  }, [fetchHealth, fetchPipelines, fetchAlerts, intervals]);

  const stop = useCallback(() => {
    if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
    if (pipelinesIntervalRef.current) clearInterval(pipelinesIntervalRef.current);
    if (alertsIntervalRef.current) clearInterval(alertsIntervalRef.current);
  }, []);

  return {
    health: healthData,
    pipelines,
    alerts,
    start,
    stop,
  };
}
