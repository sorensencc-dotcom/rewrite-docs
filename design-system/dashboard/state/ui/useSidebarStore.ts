import { create } from 'zustand';

interface SidebarState {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  open: true,
  toggle: () => set((state) => ({ open: !state.open })),
  setOpen: (open) => set({ open }),
}));
