'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Category {
  id: string;
  key: string;
  label: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export function useCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/api/categories')).data as Category[],
    staleTime: 5 * 60 * 1000,
  });

  const categories = data ?? [];
  const labels: Record<string, string> = Object.fromEntries(categories.map((c) => [c.key, c.label]));
  const icons: Record<string, string> = Object.fromEntries(categories.map((c) => [c.key, c.icon]));

  return { categories, labels, icons, isLoading };
}
