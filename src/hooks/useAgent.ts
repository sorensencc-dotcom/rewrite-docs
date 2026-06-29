import { useState, useCallback, useEffect } from "react";
import { AgentDetail, LogEvent, ExecutionRecord, AgentDetailResponse } from "../types/agents";
import { mockAgentDetail, mockLogEvents, mockExecutions } from "../mocks/agents";

export function useAgent(
  id: string,
  options: { poll?: boolean; stream?: boolean } = {}
): AgentDetailResponse {
  const { poll = true, stream = true } = options;
  const [agent, setAgent] = useState<AgentDetail | null>(mockAgentDetail);
  const [logs, setLogs] = useState<LogEvent[]>(mockLogEvents);
  const [executions, setExecutions] = useState<ExecutionRecord[]>(mockExecutions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadAgent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
      const response = await fetch(`${apiUrl}/api/agents/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load agent"));
      setAgent(mockAgentDetail);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadLogs = useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
      const response = await fetch(`${apiUrl}/api/agents/${id}/logs?limit=100`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : data.logs || mockLogEvents);
    } catch (err) {
      setLogs(mockLogEvents);
    }
  }, [id]);

  const loadExecutions = useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
      const response = await fetch(`${apiUrl}/api/agents/${id}/executions?limit=100`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setExecutions(Array.isArray(data) ? data : data.executions || mockExecutions);
    } catch (err) {
      setExecutions(mockExecutions);
    }
  }, [id]);

  const invoke = useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
      const response = await fetch(`${apiUrl}/api/agents/${id}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: "", payload: {} }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Invoke failed"));
    }
  }, [id]);

  const pause = useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
      const response = await fetch(`${apiUrl}/api/agents/${id}/pause`, { method: "POST" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await loadAgent();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Pause failed"));
    }
  }, [id, loadAgent]);

  const restart = useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
      const response = await fetch(`${apiUrl}/api/agents/${id}/restart`, { method: "POST" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await loadAgent();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Restart failed"));
    }
  }, [id, loadAgent]);

  const snapshot = useCallback(async (): Promise<string> => {
    try {
      const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
      const response = await fetch(`${apiUrl}/api/agents/${id}/snapshot`, { method: "POST" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.snapshotId || `snapshot-${Date.now()}`;
    } catch (err) {
      return `snapshot-${Date.now()}`;
    }
  }, [id]);

  useEffect(() => {
    loadAgent();
    loadLogs();
    loadExecutions();
  }, [id, loadAgent, loadLogs, loadExecutions]);

  useEffect(() => {
    if (poll) {
      const interval = setInterval(() => {
        loadAgent();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [poll, loadAgent]);

  useEffect(() => {
    if (stream) {
      // TODO: Subscribe to WebSocket at /ws/agents/{id}/logs
      // TODO: Subscribe to WebSocket at /ws/agents/{id}/executions
    }
  }, [id, stream]);

  return {
    agent,
    logs,
    executions,
    loading,
    error,
    actions: {
      invoke,
      pause,
      restart,
      snapshot,
    },
  };
}
