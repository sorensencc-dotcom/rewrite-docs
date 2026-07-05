import { useState, useCallback, useEffect } from "react";
import { mockAgentsList } from "../mocks/agents";
export function useAgentList(options = {}) {
    const { poll = true, stream = true } = options;
    const [agents, setAgents] = useState(mockAgentsList);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
            const response = await fetch(`${apiUrl}/api/agents`);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setAgents(Array.isArray(data.agents) ? data.agents : mockAgentsList);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to load agents"));
            setAgents(mockAgentsList);
        }
        finally {
            setLoading(false);
        }
    }, []);
    const snapshotAll = useCallback(async () => {
        try {
            const apiUrl = process.env.REACT_APP_AGENTS_ENDPOINT || "http://localhost:3118";
            const response = await fetch(`${apiUrl}/api/agents/snapshot`, { method: "POST" });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.snapshotId || `snapshot-${Date.now()}`;
        }
        catch (err) {
            return `snapshot-${Date.now()}`;
        }
    }, []);
    useEffect(() => {
        if (poll) {
            const interval = setInterval(refresh, 5000);
            return () => clearInterval(interval);
        }
    }, [poll, refresh]);
    useEffect(() => {
        if (stream) {
            // TODO: Subscribe to WebSocket at /ws/agents/status
        }
    }, [stream]);
    return {
        agents,
        loading,
        error,
        refresh,
        snapshotAll,
    };
}
//# sourceMappingURL=useAgentList.js.map