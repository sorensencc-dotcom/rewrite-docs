import { useQuery } from '@tanstack/react-query';

export interface IngestionQueue {
  depth: number;
  processed: number;
  errored: number;
  avgLatency: number;
  peakDepth: number;
}

export interface DLQEvent {
  id: string;
  timestamp: string;
  error: string;
  source: string;
  retries: number;
}

async function fetchIngestionQueue(): Promise<IngestionQueue> {
  // Mock data — replace with actual API call
  return {
    depth: Math.floor(Math.random() * 500),
    processed: Math.floor(Math.random() * 50000),
    errored: Math.floor(Math.random() * 100),
    avgLatency: Math.random() * 1000 + 50,
    peakDepth: Math.floor(Math.random() * 1000) + 500,
  };
}

async function fetchDLQ(): Promise<DLQEvent[]> {
  // Mock data — replace with actual API call
  return [
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      error: 'Invalid token format',
      source: 'github-webhook',
      retries: 3,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      error: 'Network timeout',
      source: 'api-client',
      retries: 5,
    },
  ];
}

export function useIngestionQueue() {
  return useQuery<IngestionQueue>({
    queryKey: ['ingestion', 'queue'],
    queryFn: fetchIngestionQueue,
    refetchInterval: 3000,
  });
}

export function useIngestionDLQ() {
  return useQuery<DLQEvent[]>({
    queryKey: ['ingestion', 'dlq'],
    queryFn: fetchDLQ,
    refetchInterval: 10000,
  });
}
