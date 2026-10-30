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
    title: 'Find Nearby Items\nIn Minutes',
    subtitle: 'Skip delivery wait. Shop local.',
    ctaText: 'Search Now',
    ctaLink: '/search',
    imageUrl: null,
    gradient: 'from-[#ff6a1a] to-[#ff9a5c]',
  },
  {
    id: 'f2',
    title: 'Get it Today!',
    subtitle: 'Local shops. Real stock. Real fast.',
    ctaText: 'Browse Shops',
    ctaLink: '/search',
    imageUrl: null,
    gradient: 'from-[#0f1b3d] to-[#2b3f7a]',
  },
  {
    id: 'f3',
    title: 'Grow Your Business',
    subtitle: 'Zero commission. Reach local customers.',
    ctaText: 'List Your Shop',
    ctaLink: '/vendor/register',
    imageUrl: null,
    gradient: 'from-[#e23744] to-[#ff7a85]',
  },
  {
    id: 'f4',
    title: '6 Simple Steps',
    subtitle: 'Search · Call · Reserve · Walk in · Buy',
    ctaText: 'How It Works',
    ctaLink: '/#how-it-works',
    imageUrl: null,
    gradient: 'from-[#3478f6] to-[#6aa0ff]',
  },
];

export type BannerModule = 'shops' | 'preowned' | 'places' | 'food';

export default function PromoBanners({ module = 'shops' }: { module?: BannerModule }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);
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

  // Responsive visible count
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setVisibleCount(3);
      else if (window.innerWidth >= 640) setVisibleCount(2);
      else setVisibleCount(1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { data: banners } = useQuery({
    queryKey: ['promo-banners', module, coords?.lat, coords?.lng],
    queryFn: async () => {
      const params = new URLSearchParams({ module });
      if (coords) { params.set('lat', String(coords.lat)); params.set('lng', String(coords.lng)); }
      const res = await api.get(`/api/banners?${params}`);
      return res.data as Banner[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Only the shops home has built-in fallback slides; other modules show nothing until admin adds banners.
  const items = banners && banners.length > 0 ? banners : module === 'shops' ? FALLBACK_BANNERS : [];
  const count = items.length;
  const maxIndex = Math.max(0, count - visibleCount);

  // Clamp current when visibleCount changes
  useEffect(() => {
    setCurrent((c) => Math.min(c, maxIndex));
  }, [maxIndex]);

  const next = useCallback(() => setCurrent((c) => (c >= maxIndex ? 0 : c + 1)), [maxIndex]);
  const prev = useCallback(() => setCurrent((c) => (c <= 0 ? maxIndex : c - 1)), [maxIndex]);

  // Auto-advance only when there are slides to scroll through
  useEffect(() => {
    if (paused || maxIndex === 0) return;
    timerRef.current = setTimeout(next, 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next, maxIndex]);

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

  // translateX % is relative to the track element (same width as container)
  // moving by 1 slide = 100% / visibleCount of container
  const translatePct = current * (100 / visibleCount);

  if (count === 0) return null;

  return (
    <section>
      <div
        className="relative overflow-hidden"
        style={{ height: '176px' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Track */}
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${translatePct}%)`,
            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {items.map((b, idx) => (
            <div
              key={b.id}
              className="relative flex-shrink-0 h-full"
              style={{
                width: `calc(100% / ${visibleCount})`,
                paddingRight: visibleCount > 1 && idx < items.length - 1 ? '12px' : '0',
              }}
            >
            <Link
              href={b.ctaLink}
              className={`relative block h-full rounded-[28px] overflow-hidden shadow-[var(--shadow-card)] ${!b.imageUrl ? `bg-gradient-to-br ${b.gradient}` : ''}`}
            >
              {b.imageUrl ? (
                <Image src={b.imageUrl} alt={b.title} fill className="object-cover" sizes="600px" />
              ) : (
                <div className="flex flex-col justify-between h-full p-4">
                  <div className="absolute right-2 top-2 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
                  <div className="relative z-10">
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Nearby</p>
                    <h3 className="text-white font-black text-sm leading-tight whitespace-pre-line">{b.title}</h3>
                    {b.subtitle && <p className="text-white/80 text-xs mt-1 leading-snug">{b.subtitle}</p>}
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block text-[11px] font-bold px-3.5 py-1.5 rounded-full" style={{ background: '#ffffff', color: '#0f1b3d' }}>
                      {b.ctaText}
                    </span>
                  </div>
                </div>
              )}
            </Link>
            </div>
          ))}
        </div>

        {/* Dot indicators — only show if scrollable */}
        {maxIndex > 0 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 3000); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '16px' : '5px',
                  height: '5px',
                  background: i === current ? '#ffffff' : 'rgba(255,255,255,0.45)',
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
