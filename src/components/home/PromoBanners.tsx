'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  ctaText: string;
  ctaLink: string;
  imageUrl: string | null;
  gradient: string;
}

const FALLBACK_BANNERS: Banner[] = [
  {
    id: 'f1',
    title: 'Find Nearby Items\nIn Minutes, Not Days',
    subtitle: 'Skip delivery wait. Shop local. Save time.',
    ctaText: 'Search Now',
    ctaLink: '/search',
    imageUrl: null,
    gradient: 'from-green-700 to-emerald-600',
  },
  {
    id: 'f2',
    title: 'Find Nearby Items\nGet it Today!',
    subtitle: 'Local shops. Real stock. Real fast.',
    ctaText: 'Browse Shops',
    ctaLink: '/search',
    imageUrl: null,
    gradient: 'from-purple-700 to-orange-500',
  },
  {
    id: 'f3',
    title: 'Grow Your Business\nWith RadiuYes',
    subtitle: 'Zero commission. Reach local customers.',
    ctaText: 'List Your Shop',
    ctaLink: '/vendor/register',
    imageUrl: null,
    gradient: 'from-slate-800 to-green-700',
  },
  {
    id: 'f4',
    title: '6 Simple Steps.\nSuper Fast.',
    subtitle: 'Search · Call · Reserve · Walk in · Buy',
    ctaText: 'How It Works',
    ctaLink: '/#how-it-works',
    imageUrl: null,
    gradient: 'from-blue-700 to-teal-600',
  },
];

export default function PromoBanners() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null),
        { timeout: 5000 }
      );
    }
  }, []);

  const { data: banners } = useQuery({
    queryKey: ['promo-banners', coords?.lat, coords?.lng],
    queryFn: async () => {
      const params = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
      const res = await api.get(`/api/banners${params}`);
      return res.data as Banner[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = banners && banners.length > 0 ? banners : FALLBACK_BANNERS;

  return (
    <section>
      {/* Scroll container — 3 visible on desktop, scrollable for more */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {items.map((b) => (
          <Link
            key={b.id}
            href={b.ctaLink}
            className={`relative flex-shrink-0 rounded-2xl overflow-hidden flex flex-col justify-between group ${!b.imageUrl ? `bg-gradient-to-br ${b.gradient} p-5` : ''}`}
            style={{ width: 'calc(33.333% - 11px)', minWidth: '260px', aspectRatio: '2/1' }}
          >
            {b.imageUrl ? (
              /* Full-cover image banner */
              <Image
                src={b.imageUrl}
                alt={b.title}
                fill
                className="object-fill"
                sizes="380px"
              />
            ) : (
              /* Gradient fallback with decorative circles */
              <>
                <div className="absolute right-3 top-3 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute right-0 top-0 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1.5">Nearby</p>
                  <h3 className="text-white font-black text-xl leading-tight whitespace-pre-line">{b.title}</h3>
                  {b.subtitle && (
                    <p className="text-white/80 text-sm mt-1.5 leading-snug">{b.subtitle}</p>
                  )}
                </div>
                <div className="relative z-10 mt-5">
                  <span className="inline-block bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-lg group-hover:bg-gray-50 transition-colors">
                    {b.ctaText}
                  </span>
                </div>
              </>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
