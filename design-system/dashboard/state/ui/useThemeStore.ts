import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  toggle: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));
