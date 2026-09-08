import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  type?: 'user' | 'vendor';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'radiuyes-auth',
      // Persisted state loads asynchronously (a microtask, even from sync
      // localStorage). Any guard effect that runs `if (!user) redirect` on
      // mount will otherwise fire before this resolves and bounce a logged-in
      // user to /login on every hard refresh. Guards must wait for
      // `hasHydrated` before treating a null user as "not logged in".
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
