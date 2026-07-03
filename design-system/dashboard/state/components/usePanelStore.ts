import { create } from 'zustand';

interface PanelState {
  expanded: boolean;
  toggle: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  expanded: true,
  toggle: () => set((state) => ({ expanded: !state.expanded })),
  setExpanded: (expanded) => set({ expanded }),
}));
