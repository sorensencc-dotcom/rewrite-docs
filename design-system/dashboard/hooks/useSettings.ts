import { useQuery } from '@tanstack/react-query';

export interface SettingsConfig {
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'cozy' | 'comfortable';
  language: string;
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  lastModified: string;
}

async function fetchSettingsConfig(): Promise<SettingsConfig> {
  // Mock data — replace with actual API call
  return {
    theme: 'dark',
    density: 'cozy',
    language: 'en',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 5000,
    lastModified: new Date().toISOString(),
  };
}

export function useSettingsConfig() {
  return useQuery<SettingsConfig>({
    queryKey: ['settings', 'config'],
    queryFn: fetchSettingsConfig,
    refetchInterval: 30000,
  });
}
