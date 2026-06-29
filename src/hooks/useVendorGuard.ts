'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function useVendorGuard() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/vendor/login');
    } else if (user.type !== 'vendor') {
      router.push('/');
    }
  }, [user]);

  return { user, isVendor: user?.type === 'vendor' };
}
