import { create } from 'zustand';

type MemoryView = 'graph' | 'table';

interface MemoryPanelState {
  selectedNode: string | null;
  view: MemoryView;
  setSelectedNode: (id: string | null) => void;
  setView: (view: MemoryView) => void;
  reset: () => void;
}

export const useMemoryPanelStore = create<MemoryPanelState>((set) => ({
  selectedNode: null,
  view: 'table',
  setSelectedNode: (id) => set({ selectedNode: id }),
  setView: (view) => set({ view }),
  reset: () => set({ selectedNode: null, view: 'table' }),
}));
