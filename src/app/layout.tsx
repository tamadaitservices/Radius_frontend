import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/providers/QueryProvider';
import SiteShell from '@/components/providers/SiteShell';
import ErrorBoundary from '@/components/ErrorBoundary';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://radiuyes.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'RadiuYes — Shop within your Radius', template: '%s | RadiuYes' },
  description: 'Find nearby shops, negotiate on call, reserve and walk in. No delivery. No waiting.',
  keywords: ['local shops', 'nearby stores', 'hyperlocal', 'Vijayawada', 'shop near me'],
  openGraph: {
    title: 'RadiuYes — Shop within your Radius',
    description: 'Find it nearby. Bargain on call. Walk in and buy.',
    siteName: 'RadiuYes',
    locale: 'en_IN',
    type: 'website',
    url: SITE,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RadiuYes',
    description: 'Find nearby shops, negotiate on call, reserve and walk in.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('ry-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')})()` }} />
      </head>
      <body>
        <QueryProvider>
          <SiteShell>
            <ErrorBoundary>{children}</ErrorBoundary>
          </SiteShell>
          <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
        </QueryProvider>
      </body>
    </html>
  );
}
