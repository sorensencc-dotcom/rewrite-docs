import { create } from 'zustand';

type DensityLevel = 'compact' | 'cozy' | 'comfortable';

interface DensityState {
  density: DensityLevel;
  setDensity: (density: DensityLevel) => void;
}

export const useDensityStore = create<DensityState>((set) => ({
  density: 'cozy',
  setDensity: (density) => set({ density }),
}));
