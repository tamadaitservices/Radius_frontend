'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export type CategoryModule = 'shops' | 'preowned' | 'places' | 'food';

export interface Category {
  id: string;
  key: string;
  module?: CategoryModule;
  label: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  reservationEnabled: boolean;
}

// Each module (shops, Resale = preowned, places, food) has its own admin-managed category list.
export function useCategories(module: CategoryModule = 'shops') {
  const { data, isLoading } = useQuery({
    queryKey: ['categories', module],
    queryFn: async () => (await api.get('/api/categories', { params: { module } })).data as Category[],
    staleTime: 5 * 60 * 1000,
  });

  const categories = data ?? [];
  const labels: Record<string, string> = Object.fromEntries(categories.map((c) => [c.key, c.label]));
  const icons: Record<string, string> = Object.fromEntries(categories.map((c) => [c.key, c.icon]));
  const reservationEnabled: Record<string, boolean> = Object.fromEntries(categories.map((c) => [c.key, c.reservationEnabled]));

  return { categories, labels, icons, reservationEnabled, isLoading };
}
