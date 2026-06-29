'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const PANEL_PREFIXES = ['/admin', '/vendor'];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPanel = PANEL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isPanel) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">{children}</main>
      <Footer />
    </>
  );
}
