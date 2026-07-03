import { useQuery, useQueries } from '@tanstack/react-query';

export interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  executionCount: number;
  errorCount: number;
}

export interface AgentHealth {
  agentId: string;
  cpu: number;
  memory: number;
  uptime: number;
  responseTime: number;
}

async function fetchAgentsList(): Promise<Agent[]> {
  // Mock data — replace with actual API call
  return [
    {
      id: '1',
      name: 'PR Reviewer',
      status: 'online',
      lastSeen: new Date().toISOString(),
      executionCount: 1247,
      errorCount: 3,
    },
    {
      id: '2',
      name: 'Code Analyzer',
      status: 'online',
      lastSeen: new Date().toISOString(),
      executionCount: 892,
      errorCount: 1,
    },
    {
      id: '3',
      name: 'Documentation Generator',
      status: 'offline',
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      executionCount: 634,
      errorCount: 0,
    },
  ];
}

async function fetchAgentHealth(agentId: string): Promise<AgentHealth> {
  // Mock data — replace with actual API call
  return {
    agentId,
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    uptime: 86400 * Math.random(),
    responseTime: Math.random() * 500 + 50,
  };
}

export function useAgentsList() {
  return useQuery<Agent[]>({
    queryKey: ['agents', 'list'],
    queryFn: fetchAgentsList,
    refetchInterval: 5000,
  });
}

export function useAgentHealth(agentId: string) {
  return useQuery<AgentHealth>({
    queryKey: ['agents', 'health', agentId],
    queryFn: () => fetchAgentHealth(agentId),
    refetchInterval: 3000,
  });
}

export function useAgentsHealth(agentIds: string[]) {
  return useQueries({
    queries: agentIds.map((id) => ({
      queryKey: ['agents', 'health', id],
      queryFn: () => fetchAgentHealth(id),
      refetchInterval: 3000,
    })),
  });
}
