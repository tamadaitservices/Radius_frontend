import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RadiuYes — Shop within your Radius',
    short_name: 'RadiuYes',
    description: 'Find nearby shops, negotiate on call, reserve and walk in.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0c831f',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    categories: ['shopping', 'lifestyle'],
    lang: 'en-IN',
    shortcuts: [
      { name: 'Search Nearby', url: '/search', description: 'Find products near you' },
      { name: 'My Reservations', url: '/reservations', description: 'View your active reservations' },
    ],
  };
}
