import { create } from 'zustand';

type TimeRange = '1h' | '6h' | '24h';

interface DriftPanelState {
  selectedCluster: string | null;
  timeRange: TimeRange;
  setSelectedCluster: (id: string | null) => void;
  setTimeRange: (range: TimeRange) => void;
  reset: () => void;
}

export const useDriftPanelStore = create<DriftPanelState>((set) => ({
  selectedCluster: null,
  timeRange: '1h',
  setSelectedCluster: (id) => set({ selectedCluster: id }),
  setTimeRange: (range) => set({ timeRange: range }),
  reset: () => set({ selectedCluster: null, timeRange: '1h' }),
}));
