import { useQuery } from '@tanstack/react-query';

export interface PipelineRun {
  id: string;
  pipelineName: string;
  status: 'running' | 'succeeded' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration: number;
  taskCount: number;
  successCount: number;
  failureCount: number;
}

async function fetchPipelineRuns(): Promise<PipelineRun[]> {
  // Mock data — replace with actual API call
  const now = new Date();
  return [
    {
      id: '1',
      pipelineName: 'Design Token Sync',
      status: 'running',
      startTime: new Date(now.getTime() - 45000).toISOString(),
      duration: 45000,
      taskCount: 5,
      successCount: 3,
      failureCount: 0,
    },
    {
      id: '2',
      pipelineName: 'Component Registry Update',
      status: 'succeeded',
      startTime: new Date(now.getTime() - 300000).toISOString(),
      endTime: new Date(now.getTime() - 240000).toISOString(),
      duration: 60000,
      taskCount: 8,
      successCount: 8,
      failureCount: 0,
    },
    {
      id: '3',
      pipelineName: 'Accessibility Audit',
      status: 'failed',
      startTime: new Date(now.getTime() - 600000).toISOString(),
      endTime: new Date(now.getTime() - 540000).toISOString(),
      duration: 60000,
      taskCount: 6,
      successCount: 4,
      failureCount: 2,
    },
  ];
}

export function usePipelineRuns() {
  return useQuery<PipelineRun[]>({
    queryKey: ['pipelines', 'runs'],
    queryFn: fetchPipelineRuns,
    refetchInterval: 5000,
  });
}
