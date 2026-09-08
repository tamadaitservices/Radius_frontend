'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function useCustomerGuard() {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (user === null) {
      router.push('/login');
    } else if (user.type === 'vendor') {
      router.push('/vendor/dashboard');
    }
  }, [user, hasHydrated]);

  return { user, isCustomer: hasHydrated && !!user && user.type !== 'vendor' };
}
