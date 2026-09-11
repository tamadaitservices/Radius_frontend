import { create } from 'zustand';

export type HomeMode = 'shops' | 'preowned' | 'places' | 'food';

interface HomeModeState {
  mode: HomeMode;
  setMode: (mode: HomeMode) => void;
}

export const useHomeModeStore = create<HomeModeState>()((set) => ({
  mode: 'shops',
  setMode: (mode) => set({ mode }),
}));
