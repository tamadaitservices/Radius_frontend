'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Tag, Store, Plus, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import ListingCard from '@/components/listing/ListingCard';
import RadiusMapControl from '@/components/home/RadiusMapControl';
import { useLocation } from '@/hooks/useLocation';
import { useAuthStore } from '@/store/auth';
import { useRadiusStore } from '@/store/radius';
import { LISTING_CATEGORY_ICONS, LISTING_CATEGORY_LABELS } from '@/lib/utils';

const CATEGORIES = Object.keys(LISTING_CATEGORY_LABELS);

export default function PreOwnedBrowse() {
  const { location, loading } = useLocation();
  const { user } = useAuthStore();
  const { radiusKm } = useRadiusStore();
  const isVendor = (user as any)?.type === 'vendor';
  const [category, setCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['listings-nearby', location.lat, location.lng, category, radiusKm],
    queryFn: async () => {
      const res = await api.get('/api/listings/nearby', {
        params: { lat: location.lat, lng: location.lng, radius: radiusKm, category: category || undefined, limit: 40 },
      });
      return res.data.listings;
    },
    enabled: !loading,
  });

  return (
    <div className="space-y-6">
      {/* Header + Post CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Tag size={22} style={{ color: 'var(--brand-ink)' }} />
            Resale
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Buy and sell used items with people near you</p>
        </div>
        {user && !isVendor && (
          <Link
            href="/sell/new"
            className="ry-pill-btn text-sm flex-shrink-0"
          >
            <Plus size={16} />
            Post a listing
          </Link>
        )}
      </div>

      {/* Become a Seller banner — shop owners with lots of stock */}
      {user && !isVendor && (
        <Link
          href="/vendor/register"
          className="flex items-center justify-between gap-3 p-4 rounded-[24px] hover:shadow-md transition-shadow"
          style={{ background: 'var(--brand-light)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <Store size={20} style={{ color: 'var(--brand-ink)' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Have a shop with lots of stock?</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Become a Seller — list unlimited products, 0% commission.</p>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--brand-ink)' }} className="flex-shrink-0" />
        </Link>
      )}

      <RadiusMapControl />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setCategory(null)}
          className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors"
          style={!category ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)', color: 'var(--on-brand)' } : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c === category ? null : c)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors"
            style={category === c ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)', color: 'var(--on-brand)' } : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <span>{LISTING_CATEGORY_ICONS[c]}</span>
            {LISTING_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {isLoading || loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[var(--brand)]" size={32} />
        </div>
      ) : data?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((listing: any, i: number) => (
            <ListingCard key={listing.id} listing={listing} index={i} />
          ))}
        </div>
      ) : (
        <div className="ry-card flex flex-col items-center justify-center gap-3 py-16">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
            <Tag size={26} style={{ color: 'var(--brand-ink)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>No listings near you yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Be the first to post something for sale.</p>
          </div>
        </div>
      )}
    </div>
  );
}
