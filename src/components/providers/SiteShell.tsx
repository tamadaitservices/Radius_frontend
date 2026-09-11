'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { useRadiusStore } from '@/store/radius';

const PANEL_PREFIXES = ['/admin', '/vendor'];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPanel = PANEL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const { hasHydrated, hasSetDefault, seedDefault } = useRadiusStore();

  useEffect(() => {
    if (!hasHydrated || hasSetDefault) return;
    api.get('/api/settings').then((r) => {
      const v = Number(r.data.search_radius_km);
      if (!isNaN(v) && v > 0) seedDefault(v);
    }).catch(() => {});
  }, [hasHydrated, hasSetDefault]);

  if (isPanel) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">{children}</main>
      <Footer />
    </>
  );
}
