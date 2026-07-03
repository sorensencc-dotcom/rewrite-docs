import { useQuery } from '@tanstack/react-query';

export interface MemoryCluster {
  id: string;
  name: string;
  size: number;
  density: number;
  vectorCount: number;
  lastUpdated: string;
}

async function fetchMemoryClusters(): Promise<MemoryCluster[]> {
  // Mock data — replace with actual API call
  return [
    {
      id: '1',
      name: 'Design System Tokens',
      size: 2.3,
      density: 0.87,
      vectorCount: 456,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Component Patterns',
      size: 1.8,
      density: 0.92,
      vectorCount: 234,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Agent Execution History',
      size: 5.2,
      density: 0.65,
      vectorCount: 892,
      lastUpdated: new Date().toISOString(),
    },
  ];
}

export function useMemoryClusters() {
  return useQuery<MemoryCluster[]>({
    queryKey: ['memory', 'clusters'],
    queryFn: fetchMemoryClusters,
    refetchInterval: 10000,
  });
}
