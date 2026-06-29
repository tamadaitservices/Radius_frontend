'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const count = items.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    touchStartX.current = null;
    setPaused(false);
  };

  return (
    <section>
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ aspectRatio: '2/1' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div
          className="flex h-full"
          style={{ transform: `translateX(-${current * 100}%)`, transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {items.map((b) => (
            <Link
              key={b.id}
              href={b.ctaLink}
              className={`relative flex-shrink-0 w-full h-full flex flex-col justify-between ${!b.imageUrl ? `bg-gradient-to-br ${b.gradient} p-5` : ''}`}
            >
              {b.imageUrl ? (
                <Image src={b.imageUrl} alt={b.title} fill className="object-fill" sizes="800px" />
              ) : (
                <>
                  <div className="absolute right-3 top-3 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute right-0 top-0 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
                  <div className="relative z-10">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1.5">Nearby</p>
                    <h3 className="text-white font-black text-xl leading-tight whitespace-pre-line">{b.title}</h3>
                    {b.subtitle && <p className="text-white/80 text-sm mt-1.5 leading-snug">{b.subtitle}</p>}
                  </div>
                  <div className="relative z-10 mt-5">
                    <span className="inline-block bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-lg">
                      {b.ctaText}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 3000); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? '20px' : '6px',
                height: '6px',
                background: i === current ? '#ffffff' : 'rgba(255,255,255,0.45)',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
