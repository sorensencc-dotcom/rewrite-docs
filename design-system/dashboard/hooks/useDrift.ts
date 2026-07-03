import { useQuery } from '@tanstack/react-query';

export interface DriftEvent {
  id: string;
  timestamp: string;
  component: string;
  tokenChanged: string;
  oldValue: string;
  newValue: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DriftStats {
  totalEvents: number;
  criticalTokens: number;
  affectedComponents: number;
  lastUpdate: string;
  hourlyEventRate: number;
}

async function fetchDriftEvents(): Promise<DriftEvent[]> {
  // Mock data — replace with actual API call
  return [
    {
      id: '1',
      timestamp: new Date(Date.now() - 10000).toISOString(),
      component: 'Button',
      tokenChanged: '--cic-color-accent',
      oldValue: '#6366f1',
      newValue: '#4f46e5',
      severity: 'high',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 20000).toISOString(),
      component: 'Input',
      tokenChanged: '--cic-space-12',
      oldValue: '12px',
      newValue: '16px',
      severity: 'medium',
    },
  ];
}

async function fetchDriftStats(): Promise<DriftStats> {
  // Mock data — replace with actual API call
  return {
    totalEvents: Math.floor(Math.random() * 500) + 100,
    criticalTokens: Math.floor(Math.random() * 10) + 2,
    affectedComponents: Math.floor(Math.random() * 8) + 3,
    lastUpdate: new Date().toISOString(),
    hourlyEventRate: Math.random() * 50 + 10,
  };
}

export function useDriftEvents() {
  return useQuery<DriftEvent[]>({
    queryKey: ['drift', 'events'],
    queryFn: fetchDriftEvents,
    refetchInterval: 2000,
  });
}

export function useDriftStats() {
  return useQuery<DriftStats>({
    queryKey: ['drift', 'stats'],
    queryFn: fetchDriftStats,
    refetchInterval: 5000,
  });
}
