import { create } from 'zustand';

interface IngestionPanelState {
  selectedQueueItem: string | null;
  showDLQ: boolean;
  setSelectedQueueItem: (id: string | null) => void;
  setShowDLQ: (show: boolean) => void;
  toggleDLQ: () => void;
  reset: () => void;
}

export const useIngestionPanelStore = create<IngestionPanelState>((set) => ({
  selectedQueueItem: null,
  showDLQ: false,
  setSelectedQueueItem: (id) => set({ selectedQueueItem: id }),
  setShowDLQ: (show) => set({ showDLQ: show }),
  toggleDLQ: () => set((state) => ({ showDLQ: !state.showDLQ })),
  reset: () => set({ selectedQueueItem: null, showDLQ: false }),
}));
