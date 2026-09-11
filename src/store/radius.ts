import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RadiusState {
  radiusKm: number;
  hasSetDefault: boolean;
  hasHydrated: boolean;
  setRadiusKm: (km: number) => void;
  seedDefault: (km: number) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useRadiusStore = create<RadiusState>()(
  persist(
    (set, get) => ({
      radiusKm: 10,
      hasSetDefault: false,
      hasHydrated: false,
      setRadiusKm: (km) => set({ radiusKm: km, hasSetDefault: true }),
      seedDefault: (km) => {
        if (!get().hasSetDefault) set({ radiusKm: km, hasSetDefault: true });
      },
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'radiuyes-radius',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
